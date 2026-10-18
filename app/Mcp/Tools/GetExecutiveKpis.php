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

#[Description('Obtiene los KPIs financieros y métricas ejecutivas globales: facturación neta en dólares ($), cantidad de facturas emitidas, ticket promedio y volumen de unidades vendidas. Permite segmentar por año o fechas específicas y por sucursal.')]
#[IsReadOnly]
class GetExecutiveKpis extends Tool
{
    protected string $name = 'get_executive_kpis';

    protected string $title = 'Obtener KPIs Ejecutivos';

    public function schema(JsonSchema $schema): array
    {
        return [
            'period' => $schema->string()
                ->enum(['2026', '2025', '2024', 'all'])
                ->description('Ejercicio anual opcional (ej. "2026", "2025", "all").'),
            'date_from' => $schema->string()
                ->description('Fecha inicial opcional en formato YYYY-MM-DD (ej. "2026-01-01").'),
            'date_to' => $schema->string()
                ->description('Fecha final opcional en formato YYYY-MM-DD (ej. "2026-10-31").'),
            'sucursal' => $schema->string()
                ->description('Código de sucursal ("001" Casa Matriz, "003" Masferrer, o "all" para consolidado empresarial).'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'period' => ['nullable', 'string', 'in:2026,2025,2024,all'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'sucursal' => ['nullable', 'string', 'max:10'],
        ]);

        $period = $validated['period'] ?? '2026';
        $sucursal = ! empty($validated['sucursal']) && $validated['sucursal'] !== 'all' ? trim((string) $validated['sucursal']) : null;
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;

        // Construir rango de fechas
        if (! $dateFrom && ! $dateTo) {
            if ($period === 'all') {
                $dateFrom = '2000-01-01';
                $dateTo = Carbon::now()->format('Y-m-d');
            } else {
                $dateFrom = "{$period}-01-01";
                $dateTo = "{$period}-12-31";
            }
        } elseif ($dateFrom && ! $dateTo) {
            $dateTo = Carbon::now()->format('Y-m-d');
        } elseif (! $dateFrom && $dateTo) {
            $dateFrom = '2024-01-01';
        }

        // Consulta de Facturación
        $invQuery = DB::table('encfct as e')
            ->where('e.estado', '!=', 'A')
            ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

        if ($sucursal) {
            $invQuery->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $invTotals = (clone $invQuery)
            ->selectRaw('
                COUNT(DISTINCT e.id_fac) as total_invoices,
                ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as total_revenue
            ')
            ->first();

        $totalRevenue = round((float) ($invTotals->total_revenue ?? 0), 2);
        $totalInvoices = (int) ($invTotals->total_invoices ?? 0);
        $averageTicket = $totalInvoices > 0 ? round($totalRevenue / $totalInvoices, 2) : 0.0;

        // Unidades despachadas
        $unitsQuery = DB::table('detfct as d')
            ->join('encfct as e', 'd.id_fac', '=', 'e.id_fac')
            ->where('e.estado', '!=', 'A')
            ->whereBetween('e.fecfct', [$dateFrom, $dateTo]);

        if ($sucursal) {
            $unitsQuery->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $totalUnits = (int) ($unitsQuery->sum(DB::raw('CAST(d.qtyvta as float)')) ?? 0);

        // Sucursal nombre
        $sucursalLabel = 'Consolidado Empresarial (Todas las sucursales)';
        if ($sucursal) {
            $branch = DB::table('sucursales')->where(DB::raw('RTRIM(codsuc)'), $sucursal)->first();
            $sucursalLabel = $branch ? trim((string) $branch->nomsuc) . " ({$sucursal})" : "Sucursal {$sucursal}";
        }

        return Response::structured([
            'success' => true,
            'ambito' => [
                'sucursal' => $sucursalLabel,
                'periodo_consultado' => $period,
                'fecha_desde' => $dateFrom,
                'fecha_hasta' => $dateTo,
            ],
            'kpis' => [
                'facturacion_neta_dolares' => $totalRevenue,
                'facturacion_formateada' => '$' . number_format($totalRevenue, 2),
                'total_facturas_emitidas' => $totalInvoices,
                'ticket_promedio_dolares' => $averageTicket,
                'ticket_promedio_formateado' => '$' . number_format($averageTicket, 2),
                'unidades_vendidas_total' => $totalUnits,
            ],
        ]);
    }
}
