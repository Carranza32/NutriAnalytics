<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardAnalyticsService
{
    /**
     * Obtiene el set completo de métricas y gráficos para el dashboard.
     */
    public function getDashboardData(?string $period = 'all'): array
    {
        $normalizedPeriod = $this->resolvePeriod($period);
        $dateRange = $this->getDateRangeForPeriod($normalizedPeriod);

        return [
            'period' => $normalizedPeriod,
            'available_periods' => [
                ['id' => 'all', 'label' => 'Histórico Total'],
                ['id' => '1998', 'label' => 'Año 1998'],
                ['id' => '1997', 'label' => 'Año 1997'],
                ['id' => '1996', 'label' => 'Año 1996'],
            ],
            'kpis' => $this->getKpis($dateRange),
            'sales_trend' => $this->getSalesTrend($dateRange),
            'category_distribution' => $this->getCategoryDistribution($dateRange),
            'top_products' => $this->getTopProducts($dateRange, 5),
            'geo_distribution' => $this->getGeographicDistribution($dateRange, 6),
            'recent_orders' => $this->getRecentOrders($dateRange, 5),
            'low_stock_alerts' => $this->getLowStockAlerts(5),
        ];
    }

    /**
     * Resuelve y valida el período seleccionado.
     */
    protected function resolvePeriod(?string $period): string
    {
        $allowed = ['all', '1998', '1997', '1996'];
        return in_array($period, $allowed, true) ? $period : 'all';
    }

    /**
     * Retorna el rango de fechas [from, to] según el período.
     */
    protected function getDateRangeForPeriod(string $period): array
    {
        return match ($period) {
            '1998' => ['from' => '1998-01-01', 'to' => '1998-12-31'],
            '1997' => ['from' => '1997-01-01', 'to' => '1997-12-31'],
            '1996' => ['from' => '1996-01-01', 'to' => '1996-12-31'],
            default => ['from' => null, 'to' => null],
        };
    }

    /**
     * Aplica filtro de fechas a una query de Orders o joins con Orders.
     */
    protected function applyDateFilter(mixed $query, array $dateRange, string $column = 'orders.order_date'): mixed
    {
        if (!empty($dateRange['from'])) {
            $query->whereDate($column, '>=', $dateRange['from']);
        }
        if (!empty($dateRange['to'])) {
            $query->whereDate($column, '<=', $dateRange['to']);
        }
        return $query;
    }

    /**
     * KPIs ejecutivos globales según período.
     */
    public function getKpis(array $dateRange): array
    {
        $ordersQuery = Order::query();
        $this->applyDateFilter($ordersQuery, $dateRange, 'order_date');
        $totalOrders = (clone $ordersQuery)->count();

        $revenueQuery = OrderDetail::query()
            ->join('orders', 'order_details.order_id', '=', 'orders.order_id');
        $this->applyDateFilter($revenueQuery, $dateRange, 'orders.order_date');

        $metrics = (clone $revenueQuery)
            ->selectRaw('
                SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) as total_revenue,
                SUM(order_details.quantity) as total_units_sold
            ')
            ->first();

        $totalRevenue = round((float) ($metrics->total_revenue ?? 0), 2);
        $totalUnits = (int) ($metrics->total_units_sold ?? 0);
        $averageOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0.0;

        // Métricas de inventario (globales)
        $lowStockCount = Product::query()
            ->where('discontinued', 0)
            ->where(function (Builder $q) {
                $q->whereColumn('units_in_stock', '<=', 'reorder_level')
                  ->orWhere('units_in_stock', '<=', 0);
            })
            ->count();

        $activeProductsCount = Product::query()->where('discontinued', 0)->count();

        return [
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'total_units_sold' => $totalUnits,
            'average_order_value' => $averageOrderValue,
            'low_stock_count' => $lowStockCount,
            'active_products_count' => $activeProductsCount,
        ];
    }

    /**
     * Tendencia mensual de ventas y volumen de órdenes.
     */
    public function getSalesTrend(array $dateRange): array
    {
        $query = OrderDetail::query()
            ->join('orders', 'order_details.order_id', '=', 'orders.order_id');

        $this->applyDateFilter($query, $dateRange, 'orders.order_date');

        $results = $query
            ->selectRaw("
                TO_CHAR(orders.order_date, 'YYYY-MM') as month_key,
                ROUND(CAST(SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) AS numeric), 2) as revenue,
                COUNT(DISTINCT orders.order_id) as orders_count,
                SUM(order_details.quantity) as units_sold
            ")
            ->groupBy('month_key')
            ->orderBy('month_key', 'asc')
            ->get();

        return $results->map(function ($item) {
            $carbon = Carbon::createFromFormat('Y-m', $item->month_key);
            $formattedMonth = $carbon ? $carbon->translatedFormat('M Y') : $item->month_key;

            return [
                'month' => $item->month_key,
                'label' => ucfirst($formattedMonth),
                'revenue' => (float) $item->revenue,
                'orders_count' => (int) $item->orders_count,
                'units_sold' => (int) $item->units_sold,
            ];
        })->values()->all();
    }

    /**
     * Distribución de ventas por categoría de producto.
     */
    public function getCategoryDistribution(array $dateRange): array
    {
        $query = OrderDetail::query()
            ->join('orders', 'order_details.order_id', '=', 'orders.order_id')
            ->join('products', 'order_details.product_id', '=', 'products.product_id')
            ->join('categories', 'products.category_id', '=', 'categories.category_id');

        $this->applyDateFilter($query, $dateRange, 'orders.order_date');

        $categories = $query
            ->selectRaw('
                categories.category_id,
                categories.category_name,
                ROUND(CAST(SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) AS numeric), 2) as revenue,
                SUM(order_details.quantity) as units_sold
            ')
            ->groupBy('categories.category_id', 'categories.category_name')
            ->orderByDesc('revenue')
            ->get();

        $totalRevenue = $categories->sum('revenue');

        return $categories->map(function ($cat) use ($totalRevenue) {
            $rev = (float) $cat->revenue;
            $pct = $totalRevenue > 0 ? round(($rev / $totalRevenue) * 100, 1) : 0.0;

            return [
                'category_id' => (int) $cat->category_id,
                'category_name' => $cat->category_name,
                'revenue' => $rev,
                'units_sold' => (int) $cat->units_sold,
                'percentage' => $pct,
            ];
        })->values()->all();
    }

    /**
     * Top productos líderes en facturación.
     */
    public function getTopProducts(array $dateRange, int $limit = 5): array
    {
        $query = OrderDetail::query()
            ->join('orders', 'order_details.order_id', '=', 'orders.order_id')
            ->join('products', 'order_details.product_id', '=', 'products.product_id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.category_id');

        $this->applyDateFilter($query, $dateRange, 'orders.order_date');

        return $query
            ->selectRaw('
                products.product_id,
                products.product_name,
                products.units_in_stock,
                COALESCE(categories.category_name, \'General\') as category_name,
                ROUND(CAST(SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) AS numeric), 2) as revenue,
                SUM(order_details.quantity) as units_sold
            ')
            ->groupBy('products.product_id', 'products.product_name', 'products.units_in_stock', 'categories.category_name')
            ->orderByDesc('revenue')
            ->take($limit)
            ->get()
            ->map(fn ($p) => [
                'product_id' => (int) $p->product_id,
                'product_name' => $p->product_name,
                'category_name' => $p->category_name,
                'revenue' => (float) $p->revenue,
                'units_sold' => (int) $p->units_sold,
                'units_in_stock' => (int) $p->units_in_stock,
            ])
            ->values()
            ->all();
    }

    /**
     * Distribución geográfica por países de envío.
     */
    public function getGeographicDistribution(array $dateRange, int $limit = 6): array
    {
        $query = OrderDetail::query()
            ->join('orders', 'order_details.order_id', '=', 'orders.order_id');

        $this->applyDateFilter($query, $dateRange, 'orders.order_date');

        return $query
            ->selectRaw('
                orders.ship_country as country,
                ROUND(CAST(SUM(order_details.unit_price * order_details.quantity * (1 - order_details.discount)) AS numeric), 2) as revenue,
                COUNT(DISTINCT orders.order_id) as orders_count
            ')
            ->whereNotNull('orders.ship_country')
            ->groupBy('orders.ship_country')
            ->orderByDesc('revenue')
            ->take($limit)
            ->get()
            ->map(fn ($row) => [
                'country' => $row->country,
                'revenue' => (float) $row->revenue,
                'orders_count' => (int) $row->orders_count,
            ])
            ->values()
            ->all();
    }

    /**
     * Órdenes más recientes dentro del período.
     */
    public function getRecentOrders(array $dateRange, int $limit = 5): array
    {
        $query = Order::query()
            ->select([
                'orders.order_id',
                'orders.customer_id',
                'orders.order_date',
                'orders.ship_country',
                'orders.freight',
            ])
            ->with(['orderDetails' => function ($q) {
                $q->select(['order_id', 'product_id', 'unit_price', 'quantity', 'discount']);
            }]);

        $this->applyDateFilter($query, $dateRange, 'order_date');

        return $query
            ->orderByDesc('order_date')
            ->take($limit)
            ->get()
            ->map(function (Order $order) {
                $itemsSubtotal = $order->orderDetails->sum(fn ($d) => $d->subtotal);
                return [
                    'order_id' => (int) $order->order_id,
                    'customer_id' => $order->customer_id,
                    'order_date' => $order->order_date?->format('Y-m-d'),
                    'ship_country' => $order->ship_country,
                    'items_count' => $order->orderDetails->count(),
                    'total_amount' => round($itemsSubtotal + (float) $order->freight, 2),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Alertas de productos con stock crítico o bajo umbral.
     */
    public function getLowStockAlerts(int $limit = 5): array
    {
        return Product::query()
            ->with('category')
            ->where('discontinued', 0)
            ->where(function (Builder $q) {
                $q->whereColumn('units_in_stock', '<=', 'reorder_level')
                  ->orWhere('units_in_stock', '<=', 0);
            })
            ->orderBy('units_in_stock', 'asc')
            ->take($limit)
            ->get()
            ->map(fn (Product $p) => [
                'product_id' => (int) $p->product_id,
                'product_name' => $p->product_name,
                'category_name' => $p->category?->category_name ?? 'General',
                'units_in_stock' => (int) $p->units_in_stock,
                'reorder_level' => (int) $p->reorder_level,
                'units_on_order' => (int) $p->units_on_order,
                'is_out_of_stock' => (int) $p->units_in_stock <= 0,
            ])
            ->values()
            ->all();
    }
}
