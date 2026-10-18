<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Description('Búsqueda inteligente de insumos y fertilizantes agrícolas en inventario: consulta existencias disponibles por bodega, precios de venta, costos y alertas de quiebre o stock crítico.')]
#[IsReadOnly]
class SearchInventoryAndStock extends Tool
{
    protected string $name = 'search_inventory_and_stock';

    protected string $title = 'Buscar Inventario y Stock';

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('Término de búsqueda: nombre comercial, código de producto o principio activo (ej. "Urea", "Yara", "15-15-15").'),
            'sucursal' => $schema->string()
                ->description('Código de bodega/sucursal opcional ("001" Casa Matriz Santa Ana, "003" Masferrer San Salvador).'),
            'marca' => $schema->string()
                ->description('Código o nombre del rubro / marca para filtrar (ej. "YaraMila", "Fertilizantes").'),
            'solo_en_alerta' => $schema->boolean()
                ->description('Si es verdadero, retorna únicamente insumos con existencia cero o en punto de reorden/alerta.'),
            'limit' => $schema->integer()
                ->min(1)
                ->max(50)
                ->description('Cantidad máxima de productos a devolver (por defecto 15).'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:100'],
            'sucursal' => ['nullable', 'string', 'max:10'],
            'marca' => ['nullable', 'string', 'max:50'],
            'solo_en_alerta' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $queryTerm = trim((string) ($validated['query'] ?? ''));
        $sucursal = ! empty($validated['sucursal']) && $validated['sucursal'] !== 'all' ? trim((string) $validated['sucursal']) : null;
        $marca = trim((string) ($validated['marca'] ?? ''));
        $soloEnAlerta = (bool) ($validated['solo_en_alerta'] ?? false);
        $limit = (int) ($validated['limit'] ?? 15);

        $q = DB::table('productos as p')
            ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
            ->where('p.estado', 'A');

        if ($queryTerm !== '') {
            $q->where(function ($sub) use ($queryTerm) {
                $sub->where('p.nomprd', 'LIKE', "%{$queryTerm}%")
                    ->orWhere('p.codprd', 'LIKE', "%{$queryTerm}%")
                    ->orWhere('p.codbar', 'LIKE', "%{$queryTerm}%");
            });
        }

        if ($marca !== '') {
            $q->where(function ($sub) use ($marca) {
                $sub->where('r.nomrub', 'LIKE', "%{$marca}%")
                    ->orWhere('p.codrub', 'LIKE', "%{$marca}%");
            });
        }

        $products = $q->select(
            DB::raw('RTRIM(p.codprd) as codprd'),
            DB::raw('RTRIM(p.nomprd) as nomprd'),
            DB::raw('RTRIM(r.nomrub) as marca'),
            DB::raw('CAST(p.precioa as float) as precio'),
            DB::raw('CAST(p.costouni as float) as costo'),
            DB::raw('RTRIM(p.unibas) as unidad')
        )
            ->take($limit * 3) // margen para filtrar por alerta si aplica
            ->get();

        if ($products->isEmpty()) {
            return Response::structured([
                'success' => true,
                'total_encontrados' => 0,
                'productos' => [],
                'mensaje' => 'No se encontraron productos coincidentes con los criterios indicados.',
            ]);
        }

        $productCodes = $products->pluck('codprd')->all();

        // Obtener existencias desglosadas por bodega
        $stockQuery = DB::table('existencias')
            ->whereIn(DB::raw('RTRIM(codprd)'), $productCodes);

        if ($sucursal) {
            $stockQuery->where(DB::raw('RTRIM(codbod)'), $sucursal);
        }

        $stockRows = $stockQuery->select(
            DB::raw('RTRIM(codprd) as codprd'),
            DB::raw('RTRIM(codbod) as codbod'),
            DB::raw('SUM(CAST(Exiprd as float)) as stock')
        )
            ->groupBy(DB::raw('RTRIM(codprd)'), DB::raw('RTRIM(codbod)'))
            ->get();

        $stockByProduct = [];
        foreach ($stockRows as $row) {
            $stockByProduct[$row->codprd][$row->codbod] = (float) $row->stock;
        }

        $results = [];
        foreach ($products as $p) {
            $bodegas = $stockByProduct[$p->codprd] ?? [];
            $totalStock = array_sum($bodegas);

            $status = 'Normal';
            if ($totalStock <= 0) {
                $status = 'Quiebre (Agotado)';
            } elseif ($totalStock < 25) {
                $status = 'Alerta (Stock Crítico)';
            }

            if ($soloEnAlerta && $status === 'Normal') {
                continue;
            }

            $results[] = [
                'codigo' => $p->codprd,
                'nombre' => $p->nomprd,
                'marca' => $p->marca ?: 'Sin Marca',
                'unidad' => $p->unidad ?: 'UDS',
                'precio_venta' => round((float) $p->precio, 2),
                'costo' => round((float) $p->costo, 2),
                'existencia_total' => round($totalStock, 2),
                'existencias_por_bodega' => [
                    '001_casa_matriz' => round($bodegas['001'] ?? 0, 2),
                    '003_masferrer' => round($bodegas['003'] ?? 0, 2),
                ],
                'estado_inventario' => $status,
            ];

            if (count($results) >= $limit) {
                break;
            }
        }

        return Response::structured([
            'success' => true,
            'total_encontrados' => count($results),
            'filtros_aplicados' => [
                'busqueda' => $queryTerm ?: 'Todos',
                'sucursal' => $sucursal ?: 'Todas (Consolidado)',
                'solo_alerta' => $soloEnAlerta,
            ],
            'productos' => $results,
        ]);
    }
}
