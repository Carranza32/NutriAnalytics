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

#[Description('Búsqueda de insumos y productos agropecuarios por nombre, categoría o disponibilidad de inventario con precios y existencias.')]
#[IsReadOnly]
class SearchProducts extends Tool
{
    protected string $name = 'search_products';

    protected string $title = 'Search Products';

    /**
     * Definición del esquema JSON de entrada para la herramienta.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('Término de búsqueda por nombre del producto o presentación (ej. "fertilizante", "seed", "chai").'),
            'category' => $schema->string()
                ->description('Filtro opcional por nombre de categoría (ej. "Beverages", "Condiments", "Fertilizantes").'),
            'only_in_stock' => $schema->boolean()
                ->description('Si es verdadero, excluye productos que tengan 0 existencias.'),
            'limit' => $schema->integer()
                ->min(1)
                ->max(50)
                ->description('Límite de resultados a retornar (por defecto 15).'),
        ];
    }

    /**
     * Ejecuta la búsqueda de productos y retorna los registros limpios.
     */
    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:50'],
            'only_in_stock' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $limit = (int) ($validated['limit'] ?? 15);
        $searchTerm = trim((string) ($validated['query'] ?? ''));
        $categoryFilter = trim((string) ($validated['category'] ?? ''));
        $onlyInStock = (bool) ($validated['only_in_stock'] ?? false);

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
            ]);

        if ($searchTerm !== '') {
            $lowerSearch = '%' . mb_strtolower($searchTerm, 'UTF-8') . '%';
            $query->where(function ($q) use ($lowerSearch) {
                $q->whereRaw('LOWER(product_name) LIKE ?', [$lowerSearch])
                  ->orWhereRaw('LOWER(quantity_per_unit) LIKE ?', [$lowerSearch]);
            });
        }

        if ($categoryFilter !== '') {
            $lowerCategory = '%' . mb_strtolower($categoryFilter, 'UTF-8') . '%';
            $query->whereHas('category', function ($q) use ($lowerCategory) {
                $q->whereRaw('LOWER(category_name) LIKE ?', [$lowerCategory]);
            });
        }

        if ($onlyInStock) {
            $query->where('units_in_stock', '>', 0);
        }

        $products = $query->orderBy('product_name', 'asc')->take($limit)->get();

        $formatted = $products->map(function (Product $product) {
            return [
                'product_id' => (int) $product->product_id,
                'product_name' => $product->product_name,
                'category' => $product->category?->category_name ?? 'Sin Categoría',
                'presentation' => $product->quantity_per_unit,
                'unit_price' => (float) $product->unit_price,
                'units_in_stock' => (int) $product->units_in_stock,
                'units_on_order' => (int) $product->units_on_order,
                'is_available' => (int) $product->units_in_stock > 0 && ! $product->discontinued,
                'discontinued' => (bool) $product->discontinued,
            ];
        });

        return Response::structured([
            'success' => true,
            'filters_applied' => [
                'query' => $searchTerm !== '' ? $searchTerm : null,
                'category' => $categoryFilter !== '' ? $categoryFilter : null,
                'only_in_stock' => $onlyInStock,
            ],
            'total_found' => $formatted->count(),
            'products' => $formatted->values()->all(),
        ]);
    }
}
