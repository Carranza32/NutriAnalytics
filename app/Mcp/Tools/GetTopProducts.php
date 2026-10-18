<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Description('Ranking de los productos e insumos agrícolas más vendidos de la empresa: permite ordenar por facturación neta ($) o volumen de unidades despachadas, segmentado por fechas y sucursal.')]
#[IsReadOnly]
class GetTopProducts extends Tool
{
    protected string $name = 'get_top_products';

    protected string $title = 'Obtener Productos Más Vendidos';

    public function schema(JsonSchema $schema): array
    {
        return [
            'order_by' => $schema->string()
                ->enum(['revenue', 'units'])
                ->description('Criterio de ordenamiento: "revenue" (por dólares facturados) o "units" (por cantidad de unidades vendidas). Por defecto "revenue".'),
            'date_from' => $schema->string()
                ->description('Fecha inicial opcional en formato YYYY-MM-DD (por defecto 2026-01-01).'),
            'date_to' => $schema->string()
                ->description('Fecha final opcional en formato YYYY-MM-DD (por defecto hoy).'),
            'sucursal' => $schema->string()
                ->description('Código de sucursal opcional ("001", "003", o "all").'),
            'limit' => $schema->integer()
                ->min(1)
                ->max(50)
                ->description('Cantidad máxima de productos a listar (por defecto 10).'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'order_by' => ['nullable', 'string', 'in:revenue,units'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'sucursal' => ['nullable', 'string', 'max:10'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $orderBy = $validated['order_by'] ?? 'revenue';
        $dateFrom = $validated['date_from'] ?? '2026-01-01';
        $dateTo = $validated['date_to'] ?? Carbon::now()->format('Y-m-d');
        $sucursal = ! empty($validated['sucursal']) && $validated['sucursal'] !== 'all' ? trim((string) $validated['sucursal']) : null;
        $limit = (int) ($validated['limit'] ?? 10);

        $q = DB::table('detfct as d')
            ->join('encfct as e', 'd.id_fac', '=', 'e.id_fac')
            ->leftJoin('productos as p', DB::raw('RTRIM(d.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
            ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
            ->where('e.estado', '!=', 'A')
            ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

        if ($sucursal) {
            $q->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $orderColumn = $orderBy === 'units' ? 'units_sold' : 'revenue';

        $products = $q->select(
            DB::raw('RTRIM(d.codprd) as codprd'),
            DB::raw("COALESCE(NULLIF(RTRIM(p.nomprd), ''), RTRIM(d.codprd)) as nomprd"),
            DB::raw("COALESCE(NULLIF(RTRIM(r.nomrub), ''), 'Sin Marca') as marca"),
            DB::raw('ROUND(SUM(CAST(d.qtyvta as float) * CAST(d.prcact as float)), 2) as revenue'),
            DB::raw('ROUND(SUM(CAST(d.qtyvta as float)), 0) as units_sold')
        )
            ->groupBy(DB::raw('d.codprd'), DB::raw('p.nomprd'), DB::raw('r.nomrub'))
            ->orderByDesc($orderColumn)
            ->take($limit)
            ->get();

        if ($products->isEmpty()) {
            return Response::structured([
                'success' => true,
                'total' => 0,
                'productos' => [],
                'mensaje' => 'No se registraron ventas de productos en el rango de fechas indicado.',
            ]);
        }

        // Obtener stock actual de los productos en el ranking
        $codes = $products->pluck('codprd')->all();
        $stockQuery = DB::table('existencias')
            ->whereIn(DB::raw('RTRIM(codprd)'), $codes);

        if ($sucursal) {
            $stockQuery->where(DB::raw('RTRIM(codbod)'), $sucursal);
        }

        $stockMap = $stockQuery->select(
            DB::raw('RTRIM(codprd) as codprd'),
            DB::raw('SUM(CAST(exiprd as float)) as stock')
        )
            ->groupBy(DB::raw('RTRIM(codprd)'))
            ->pluck('stock', 'codprd');

        $ranking = [];
        $i = 1;
        foreach ($products as $p) {
            $rev = (float) $p->revenue;
            $units = (int) $p->units_sold;
            $avgPrc = $units > 0 ? round($rev / $units, 2) : 0.0;
            $currentStock = round((float) ($stockMap[$p->codprd] ?? 0), 2);

            $ranking[] = [
                'posicion' => $i++,
                'codigo' => $p->codprd,
                'nombre' => $p->nomprd,
                'marca' => $p->marca,
                'facturacion_total' => '$' . number_format($rev, 2),
                'monto_numero' => $rev,
                'unidades_vendidas' => $units,
                'precio_promedio' => '$' . number_format($avgPrc, 2),
                'stock_actual_disponible' => $currentStock,
            ];
        }

        return Response::structured([
            'success' => true,
            'criterio_orden' => $orderBy === 'units' ? 'Por volumen de unidades vendidas' : 'Por facturación total ($)',
            'periodo' => [
                'desde' => $dateFrom,
                'hasta' => $dateTo,
            ],
            'sucursal' => $sucursal ?: 'Todas las sucursales (Consolidado)',
            'ranking' => $ranking,
        ]);
    }
}
