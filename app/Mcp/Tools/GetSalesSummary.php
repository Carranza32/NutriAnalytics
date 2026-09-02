<?php

namespace App\Mcp\Tools;

use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Description('Genera un resumen analítico comercial y de ventas: métricas financieras, volumen de pedidos, órdenes destacadas y productos líderes.')]
#[IsReadOnly]
class GetSalesSummary extends Tool
{
    protected string $name = 'get_sales_summary';

    protected string $title = 'Get Sales Summary';

    /**
     * Definición del esquema JSON de entrada para la herramienta.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'from_date' => $schema->string()
                ->description('Fecha inicial opcional para el período de análisis en formato YYYY-MM-DD (ej. "1997-01-01").'),
            'to_date' => $schema->string()
                ->description('Fecha final opcional para el período de análisis en formato YYYY-MM-DD (ej. "1997-12-31").'),
            'limit_orders' => $schema->integer()
                ->min(1)
                ->max(20)
                ->description('Cantidad de órdenes recientes/destacadas a incluir en el desglose (por defecto 5).'),
        ];
    }

    /**
     * Ejecuta el análisis de ventas optimizado y de solo lectura.
     */
    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'from_date' => ['nullable', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from_date'],
            'limit_orders' => ['nullable', 'integer', 'between:1,20'],
        ]);

        $fromDate = $validated['from_date'] ?? null;
        $toDate = $validated['to_date'] ?? null;
        $limitOrders = (int) ($validated['limit_orders'] ?? 5);

        // Subquery base para órdenes filtradas
        $ordersQuery = Order::query();
        if ($fromDate) {
            $ordersQuery->whereDate('order_date', '>=', $fromDate);
        }
        if ($toDate) {
            $ordersQuery->whereDate('order_date', '<=', $toDate);
        }

        $totalOrders = (clone $ordersQuery)->count();

        // Si no hay órdenes en ese rango
        if ($totalOrders === 0) {
            return Response::structured([
                'success' => true,
                'message' => 'No se encontraron órdenes en el período especificado.',
                'period' => ['from' => $fromDate, 'to' => $toDate],
                'metrics' => [
                    'total_orders' => 0,
                    'total_revenue' => 0.0,
                    'average_ticket' => 0.0,
                ],
                'top_products' => [],
                'recent_orders' => [],
            ]);
        }

        // Métricas de ventas totales cruzando con order_details
        $revenueQuery = OrderDetail::query()
            ->join('orders', 'order_details.order_id', '=', 'orders.order_id');

        if ($fromDate) {
            $revenueQuery->whereDate('orders.order_date', '>=', $fromDate);
        }
        if ($toDate) {
            $revenueQuery->whereDate('orders.order_date', '<=', $toDate);
        }

        $metrics = (clone $revenueQuery)
            ->selectRaw('
                SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) as total_revenue,
                SUM(order_details.quantity) as total_units_sold,
                COUNT(DISTINCT orders.order_id) as orders_count
            ')
            ->first();

        $totalRevenue = round((float) ($metrics->total_revenue ?? 0), 2);
        $totalUnits = (int) ($metrics->total_units_sold ?? 0);
        $averageTicket = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0.0;

        // Top 5 productos más vendidos por facturación
        $topProducts = (clone $revenueQuery)
            ->join('products', 'order_details.product_id', '=', 'products.product_id')
            ->selectRaw('
                products.product_id,
                products.product_name,
                SUM(order_details.quantity) as units_sold,
                ROUND(CAST(SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) AS numeric), 2) as revenue
            ')
            ->groupBy('products.product_id', 'products.product_name')
            ->orderByDesc('revenue')
            ->take(5)
            ->get()
            ->map(fn ($p) => [
                'product_id' => (int) $p->product_id,
                'product_name' => $p->product_name,
                'units_sold' => (int) $p->units_sold,
                'revenue' => (float) $p->revenue,
            ]);

        // Órdenes destacadas / recientes con cálculo de su total
        $recentOrders = (clone $ordersQuery)
            ->select([
                'orders.order_id',
                'orders.customer_id',
                'orders.order_date',
                'orders.ship_country',
                'orders.freight',
            ])
            ->with(['orderDetails' => function ($q) {
                $q->select(['order_id', 'product_id', 'unit_price', 'quantity', 'discount']);
            }])
            ->orderByDesc('order_date')
            ->take($limitOrders)
            ->get()
            ->map(function (Order $order) {
                $orderTotal = $order->orderDetails->sum(fn ($d) => $d->subtotal);
                return [
                    'order_id' => (int) $order->order_id,
                    'customer_id' => $order->customer_id,
                    'order_date' => $order->order_date?->format('Y-m-d'),
                    'destination_country' => $order->ship_country,
                    'items_count' => $order->orderDetails->count(),
                    'total_amount' => round($orderTotal + (float) $order->freight, 2),
                ];
            });

        return Response::structured([
            'success' => true,
            'period' => [
                'from' => $fromDate,
                'to' => $toDate,
            ],
            'kpis' => [
                'total_revenue' => $totalRevenue,
                'currency' => 'USD',
                'total_orders' => $totalOrders,
                'total_units_sold' => $totalUnits,
                'average_order_value' => $averageTicket,
            ],
            'top_products_by_revenue' => $topProducts->values()->all(),
            'recent_orders' => $recentOrders->values()->all(),
        ]);
    }
}
