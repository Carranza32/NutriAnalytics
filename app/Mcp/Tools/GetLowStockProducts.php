<?php

namespace App\Mcp\Tools;

use App\Models\Product;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Description('Consulta productos e insumos agrícolas con stock crítico o en punto de reorden para auditorías preventivas de inventario.')]
#[IsReadOnly]
class GetLowStockProducts extends Tool
{
    protected string $name = 'get_low_stock_products';

    protected string $title = 'Get Low Stock Products';

    /**
     * Definición del esquema JSON de entrada para la herramienta.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'category_id' => $schema->integer()
                ->description('ID opcional de categoría para filtrar insumos específicos (ej. Fertilizantes, Semillas).'),
            'limit' => $schema->integer()
                ->min(1)
                ->max(100)
                ->description('Cantidad máxima de productos a devolver (por defecto 20).'),
        ];
    }

    /**
     * Ejecuta la consulta de stock y retorna el resultado estructurado.
     */
    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $limit = (int) ($validated['limit'] ?? 20);
        $categoryId = isset($validated['category_id']) ? (int) $validated['category_id'] : null;

        $query = Product::with('category:category_id,category_name')
            ->select([
                'product_id',
                'product_name',
                'category_id',
                'quantity_per_unit',
                'unit_price',
                'units_in_stock',
                'units_on_order',
                'reorder_level',
                'discontinued',
            ])
            ->lowStock()
            ->orderBy('units_in_stock', 'asc')
            ->orderBy('reorder_level', 'desc');

        if ($categoryId !== null) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->take($limit)->get();

        $formatted = $products->map(function (Product $product) {
            $stock = (int) $product->units_in_stock;
            $reorder = (int) $product->reorder_level;
            $deficit = max(0, $reorder - $stock);

            return [
                'product_id' => (int) $product->product_id,
                'product_name' => $product->product_name,
                'category' => $product->category?->category_name ?? 'Sin Categoría',
                'presentation' => $product->quantity_per_unit,
                'unit_price' => (float) $product->unit_price,
                'units_in_stock' => $stock,
                'units_on_order' => (int) $product->units_on_order,
                'reorder_level' => $reorder,
                'deficit_units' => $deficit,
                'status' => $stock === 0 ? 'AGOTADO' : 'STOCK_CRITICO',
                'discontinued' => (bool) $product->discontinued,
            ];
        });

        return Response::structured([
            'success' => true,
            'summary' => [
                'total_alert_products' => $formatted->count(),
                'filter_category_id' => $categoryId,
            ],
            'products' => $formatted->values()->all(),
        ]);
    }
}
