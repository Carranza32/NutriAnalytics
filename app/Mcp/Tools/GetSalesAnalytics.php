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

#[Description('Genera análisis detallados de ventas agrupados por asesor comercial (vendedor), marca/rubro, sucursal o mes. Permite auditar rendimientos comerciales, metas y participación de mercado.')]
#[IsReadOnly]
class GetSalesAnalytics extends Tool
{
    protected string $name = 'get_sales_analytics';

    protected string $title = 'Obtener Analítica de Ventas';

    public function schema(JsonSchema $schema): array
    {
        return [
            'group_by' => $schema->string()
                ->enum(['vendedor', 'marca', 'sucursal', 'mes'])
                ->description('Criterio de agrupación para el desglose: "vendedor", "marca", "sucursal", o "mes" (por defecto "vendedor").'),
            'date_from' => $schema->string()
                ->description('Fecha inicial en formato YYYY-MM-DD (por defecto 2026-01-01).'),
            'date_to' => $schema->string()
                ->description('Fecha final en formato YYYY-MM-DD (por defecto hoy).'),
            'sucursal' => $schema->string()
                ->description('Código de sucursal opcional ("001", "003", o "all").'),
            'vendedor_id' => $schema->string()
                ->description('Código opcional de vendedor para acotar las ventas a un asesor específico.'),
            'limit' => $schema->integer()
                ->min(1)
                ->max(50)
                ->description('Cantidad máxima de filas a retornar (por defecto 15).'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'group_by' => ['nullable', 'string', 'in:vendedor,marca,sucursal,mes'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'sucursal' => ['nullable', 'string', 'max:10'],
            'vendedor_id' => ['nullable', 'string', 'max:20'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $groupBy = $validated['group_by'] ?? 'vendedor';
        $dateFrom = $validated['date_from'] ?? '2026-01-01';
        $dateTo = $validated['date_to'] ?? Carbon::now()->format('Y-m-d');
        $sucursal = ! empty($validated['sucursal']) && $validated['sucursal'] !== 'all' ? trim((string) $validated['sucursal']) : null;
        $vendedorId = ! empty($validated['vendedor_id']) ? trim((string) $validated['vendedor_id']) : null;
        $limit = (int) ($validated['limit'] ?? 15);

        if ($groupBy === 'vendedor') {
            $q = DB::table('encfct as e')
                ->leftJoin('vendedores as v', DB::raw('RTRIM(e.codven)'), '=', DB::raw('RTRIM(v.codven)'))
                ->where('e.estado', '!=', 'A')
                ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

            if ($sucursal) {
                $q->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
            }
            if ($vendedorId) {
                $q->where(DB::raw('RTRIM(e.codven)'), $vendedorId);
            }

            $rows = $q->select(
                DB::raw("COALESCE(NULLIF(RTRIM(v.nomven), ''), 'Asesor Sin Asignar (' + RTRIM(e.codven) + ')') as nombre"),
                DB::raw('RTRIM(e.codven) as codigo'),
                DB::raw('ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as venta'),
                DB::raw('COUNT(DISTINCT e.ID_Fac) as facturas')
            )
                ->groupBy(DB::raw('e.codven'), DB::raw('v.nomven'))
                ->orderByDesc('venta')
                ->take($limit)
                ->get();
        } elseif ($groupBy === 'marca') {
            $q = DB::table('detfct as d')
                ->join('encfct as e', 'd.ID_Fac', '=', 'e.ID_Fac')
                ->leftJoin('productos as p', DB::raw('RTRIM(d.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
                ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
                ->where('e.estado', '!=', 'A')
                ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

            if ($sucursal) {
                $q->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
            }
            if ($vendedorId) {
                $q->where(DB::raw('RTRIM(e.codven)'), $vendedorId);
            }

            $rows = $q->select(
                DB::raw("COALESCE(NULLIF(RTRIM(r.nomrub), ''), 'Otras / Sin Marca') as nombre"),
                DB::raw('RTRIM(p.codrub) as codigo'),
                DB::raw('ROUND(SUM(CAST(d.qtyvta as float) * CAST(d.prcact as float)), 2) as venta'),
                DB::raw('ROUND(SUM(CAST(d.qtyvta as float)), 0) as unidades')
            )
                ->groupBy(DB::raw('p.codrub'), DB::raw('r.nomrub'))
                ->orderByDesc('venta')
                ->take($limit)
                ->get();
        } elseif ($groupBy === 'sucursal') {
            $q = DB::table('encfct as e')
                ->leftJoin('sucursales as s', DB::raw('RTRIM(e.codsuc)'), '=', DB::raw('RTRIM(s.codsuc)'))
                ->where('e.estado', '!=', 'A')
                ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

            $rows = $q->select(
                DB::raw("COALESCE(NULLIF(RTRIM(s.nomsuc), ''), 'Sucursal ' + RTRIM(e.codsuc)) as nombre"),
                DB::raw('RTRIM(e.codsuc) as codigo'),
                DB::raw('ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as venta'),
                DB::raw('COUNT(DISTINCT e.ID_Fac) as facturas')
            )
                ->groupBy(DB::raw('e.codsuc'), DB::raw('s.nomsuc'))
                ->orderByDesc('venta')
                ->get();
        } else { // mes
            $q = DB::table('encfct as e')
                ->where('e.estado', '!=', 'A')
                ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

            if ($sucursal) {
                $q->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
            }

            $rows = $q->select(
                DB::raw('MONTH(e.fecfct) as mes_num'),
                DB::raw('YEAR(e.fecfct) as anio'),
                DB::raw('ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as venta'),
                DB::raw('COUNT(DISTINCT e.ID_Fac) as facturas')
            )
                ->groupBy(DB::raw('YEAR(e.fecfct)'), DB::raw('MONTH(e.fecfct)'))
                ->orderBy('anio')
                ->orderBy('mes_num')
                ->get()
                ->map(function ($r) {
                    $monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                    $r->nombre = ($monthNames[$r->mes_num] ?? 'Mes ' . $r->mes_num) . ' ' . $r->anio;
                    $r->codigo = $r->anio . '-' . str_pad((string) $r->mes_num, 2, '0', STR_PAD_LEFT);
                    return $r;
                });
        }

        $totalVenta = (float) $rows->sum('venta');

        $desglose = $rows->map(function ($r) use ($totalVenta) {
            $venta = (float) $r->venta;
            $pct = $totalVenta > 0 ? round(($venta / $totalVenta) * 100, 1) : 0;
            $item = [
                'identificador' => $r->codigo,
                'nombre' => $r->nombre,
                'venta_monto' => $venta,
                'venta_formateada' => '$' . number_format($venta, 2),
                'porcentaje_participacion' => $pct . '%',
            ];
            if (isset($r->facturas)) {
                $item['total_facturas'] = (int) $r->facturas;
            }
            if (isset($r->unidades)) {
                $item['unidades_vendidas'] = (int) $r->unidades;
            }
            return $item;
        });

        return Response::structured([
            'success' => true,
            'agrupado_por' => $groupBy,
            'periodo' => [
                'desde' => $dateFrom,
                'hasta' => $dateTo,
            ],
            'venta_total_filtrada' => '$' . number_format($totalVenta, 2),
            'desglose' => $desglose,
        ]);
    }
}
