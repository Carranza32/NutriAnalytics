<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardAnalyticsService
{
    /**
     * Obtiene el set completo de métricas y gráficos para el dashboard empresarial.
     * Implementa caché inteligente de 20 minutos para cargas inferiores a 200 ms.
     */
    public function getDashboardData(?string $period = '2026', ?string $sucursal = 'all', bool $forceRefresh = false): array
    {
        $normalizedPeriod = $this->resolvePeriod($period);
        $normalizedSucursal = $this->resolveSucursal($sucursal);
        $sucursalKey = $normalizedSucursal ?? 'all';
        $cacheKey = "dashboard_analytics_{$normalizedPeriod}_{$sucursalKey}";

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        $cached = Cache::remember($cacheKey, now()->addMinutes(20), function () use ($normalizedPeriod, $normalizedSucursal) {
            $dateRange = $this->getDateRangeForPeriod($normalizedPeriod);

            return [
                'kpis' => $this->getKpis($dateRange, $normalizedSucursal),
                'sales_trend' => $this->getSalesTrend($dateRange, $normalizedSucursal),
                'category_distribution' => $this->getCategoryDistribution($dateRange, $normalizedSucursal),
                'top_products' => $this->getTopProducts($dateRange, 5, $normalizedSucursal),
                'geo_distribution' => $this->getCommercialForceDistribution($dateRange, 6, $normalizedSucursal),
                'yoy_comparison' => $this->getYearOverYearComparison($normalizedSucursal),
                'cxc_matrix' => $this->getAccountsReceivableAndClientMatrix($normalizedSucursal),
                'supply_chain' => $this->getSupplyChainTrafficLight($normalizedSucursal),
                'cached_at' => Carbon::now()->toIso8601String(),
            ];
        });

        return [
            'period' => $normalizedPeriod,
            'available_periods' => [
                ['id' => '2026', 'label' => 'Año 2026 (Actual)'],
                ['id' => '2025', 'label' => 'Año 2025'],
                ['id' => '2024', 'label' => 'Año 2024'],
                ['id' => 'all', 'label' => 'Histórico Total'],
            ],
            'sucursal' => $normalizedSucursal ?? 'all',
            'available_sucursales' => $this->getAvailableSucursales(),
            'kpis' => $cached['kpis'],
            'sales_trend' => $cached['sales_trend'],
            'category_distribution' => $cached['category_distribution'],
            'top_products' => $cached['top_products'],
            'geo_distribution' => $cached['geo_distribution'],
            'recent_orders' => [],
            'low_stock_alerts' => [],
            'yoy_comparison' => $cached['yoy_comparison'],
            'cxc_matrix' => $cached['cxc_matrix'],
            'supply_chain' => $cached['supply_chain'],
            'last_updated' => $cached['cached_at'] ?? Carbon::now()->toIso8601String(),
            'is_cached' => true,
        ];
    }

    /**
     * Invalida la caché completa de analíticas para todos los períodos y sucursales.
     */
    public function clearAllDashboardCache(): void
    {
        $periods = ['2026', '2025', '2024', 'all'];
        $sucursales = ['all'];

        try {
            $dbSucursales = DB::table('sucursales')->pluck('codsuc')->map(fn ($id) => trim((string) $id))->all();
            $sucursales = array_merge($sucursales, $dbSucursales);
        } catch (\Throwable $e) {
            // fallback
        }

        foreach ($periods as $p) {
            foreach ($sucursales as $s) {
                Cache::forget("dashboard_analytics_{$p}_{$s}");
            }
        }
    }

    /**
     * Resuelve y valida la sucursal seleccionada.
     */
    protected function resolveSucursal(?string $sucursal): ?string
    {
        if (empty($sucursal) || $sucursal === 'all') {
            return null;
        }

        $clean = trim((string) $sucursal);
        $validIds = DB::table('sucursales')->pluck('codsuc')->map(fn ($id) => trim((string) $id))->all();

        return in_array($clean, $validIds, true) ? $clean : null;
    }

    /**
     * Listado de sucursales disponibles para el selector global.
     */
    public function getAvailableSucursales(): array
    {
        $rows = DB::table('sucursales')
            ->select(DB::raw('RTRIM(codsuc) as id'), DB::raw('RTRIM(nomsuc) as name'))
            ->whereNotNull('nomsuc')
            ->orderBy('id')
            ->get();

        $list = [
            ['id' => 'all', 'name' => 'Todas las Sucursales (Consolidado)'],
        ];

        foreach ($rows as $r) {
            $name = trim((string) $r->name);
            if ($name === 'CAZA MATRIZ') {
                $name = 'CASA MATRIZ (Santa Ana)';
            } elseif ($name === 'MASFERRER') {
                $name = 'MASFERRER (San Salvador)';
            }
            $list[] = [
                'id' => (string) $r->id,
                'name' => $name,
            ];
        }

        return $list;
    }

    /**
     * Resuelve y valida el período seleccionado.
     */
    protected function resolvePeriod(?string $period): string
    {
        $allowed = ['2026', '2025', '2024', 'all'];

        return in_array($period, $allowed, true) ? (string) $period : '2026';
    }

    /**
     * Retorna el rango de fechas [from, to] según el período.
     */
    protected function getDateRangeForPeriod(string $period): array
    {
        return match ($period) {
            '2026' => ['from' => '2026-01-01', 'to' => '2026-12-31'],
            '2025' => ['from' => '2025-01-01', 'to' => '2025-12-31'],
            '2024' => ['from' => '2024-01-01', 'to' => '2024-12-31'],
            default => ['from' => null, 'to' => null],
        };
    }

    /**
     * Aplica filtro de fechas a una consulta SQL Server.
     */
    protected function applyDateFilter(mixed $query, array $dateRange, string $column = 'e.fecfct'): mixed
    {
        if (! empty($dateRange['from'])) {
            $query->whereDate($column, '>=', $dateRange['from']);
        }
        if (! empty($dateRange['to'])) {
            $query->whereDate($column, '<=', $dateRange['to']);
        }

        return $query;
    }

    /**
     * KPIs ejecutivos globales según período y sucursal.
     */
    public function getKpis(array $dateRange, ?string $sucursal = null): array
    {
        $invoicesQuery = DB::table('encfct as e')
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $invoicesQuery->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($invoicesQuery, $dateRange, 'e.fecfct');

        $invoiceMetrics = (clone $invoicesQuery)
            ->selectRaw('
                COUNT(DISTINCT e.id_fac) as total_invoices,
                ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as total_revenue
            ')
            ->first();

        $totalRevenue = round((float) ($invoiceMetrics->total_revenue ?? 0), 2);
        $totalOrders = (int) ($invoiceMetrics->total_invoices ?? 0);
        $averageOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0.0;

        // Unidades vendidas en el período
        $itemsQuery = DB::table('detfct as d')
            ->join('encfct as e', 'd.id_fac', '=', 'e.id_fac')
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $itemsQuery->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($itemsQuery, $dateRange, 'e.fecfct');

        $totalUnits = (int) ($itemsQuery->sum(DB::raw('CAST(d.qtyvta as float)')) ?? 0);

        // Artículos activos e inventario en quiebre o agotado
        $activeProductsCount = DB::table('productos')->where('estado', 'A')->count();

        $stockQuery = DB::table('existencias as ex')
            ->join('productos as p', DB::raw('RTRIM(ex.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
            ->where('p.estado', 'A');

        if (! empty($sucursal)) {
            if ($sucursal === '003') {
                $stockQuery->where(DB::raw('RTRIM(ex.codbod)'), '003');
            } elseif ($sucursal === '001') {
                $stockQuery->where(DB::raw('RTRIM(ex.codbod)'), '!=', '003');
            }
        }

        $lowStockCount = $stockQuery
            ->groupBy('ex.codprd')
            ->havingRaw('SUM(CAST(ex.exiprd as float)) <= 0')
            ->select('ex.codprd')
            ->get()
            ->count();

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
     * Tendencia mensual de facturación y volumen de pedidos.
     */
    public function getSalesTrend(array $dateRange, ?string $sucursal = null): array
    {
        $query = DB::table('encfct as e')
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $query->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($query, $dateRange, 'e.fecfct');

        $isPgsql = DB::connection()->getDriverName() === 'pgsql';
        $monthExpr = $isPgsql ? "to_char(e.fecfct, 'YYYY-MM')" : "FORMAT(e.fecfct, 'yyyy-MM')";

        $results = $query
            ->selectRaw("
                {$monthExpr} as month_key,
                ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as revenue,
                COUNT(DISTINCT e.id_fac) as orders_count
            ")
            ->groupBy(DB::raw($monthExpr))
            ->orderBy('month_key', 'asc')
            ->get();

        $unitsQuery = DB::table('detfct as d')
            ->join('encfct as e', 'd.id_fac', '=', 'e.id_fac')
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $unitsQuery->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($unitsQuery, $dateRange, 'e.fecfct');
        $unitsByMonth = $unitsQuery
            ->selectRaw("
                {$monthExpr} as month_key,
                ROUND(SUM(CAST(d.qtyvta as float)), 0) as units_sold
            ")
            ->groupBy(DB::raw($monthExpr))
            ->pluck('units_sold', 'month_key');

        return $results->map(function ($item) use ($unitsByMonth) {
            $monthKey = (string) $item->month_key;
            $carbon = Carbon::createFromFormat('Y-m', $monthKey);
            $formattedMonth = $carbon ? $carbon->translatedFormat('M Y') : $monthKey;

            return [
                'month' => $monthKey,
                'label' => ucfirst($formattedMonth),
                'revenue' => (float) $item->revenue,
                'orders_count' => (int) $item->orders_count,
                'units_sold' => (int) ($unitsByMonth[$monthKey] ?? 0),
            ];
        })->values()->all();
    }

    /**
     * Distribución de ventas por Marca / Rubro de producto.
     */
    public function getCategoryDistribution(array $dateRange, ?string $sucursal = null): array
    {
        $query = DB::table('detfct as d')
            ->join('encfct as e', 'd.id_fac', '=', 'e.id_fac')
            ->join('productos as p', DB::raw('RTRIM(d.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
            ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $query->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($query, $dateRange, 'e.fecfct');

        $rubros = $query
            ->selectRaw('
                RTRIM(COALESCE(r.nomrub, \'OTRAS MARCAS\')) as category_name,
                ROUND(SUM(CAST(d.qtyvta as float) * CAST(d.prcact as float)), 2) as revenue,
                ROUND(SUM(CAST(d.qtyvta as float)), 0) as units_sold
            ')
            ->groupBy(DB::raw('RTRIM(COALESCE(r.nomrub, \'OTRAS MARCAS\'))'))
            ->orderByDesc('revenue')
            ->take(8)
            ->get();

        $totalRevenue = (float) $rubros->sum('revenue');

        return $rubros->map(function ($cat, $idx) use ($totalRevenue) {
            $rev = (float) $cat->revenue;
            $pct = $totalRevenue > 0 ? round(($rev / $totalRevenue) * 100, 1) : 0.0;

            return [
                'category_id' => $idx + 1,
                'category_name' => (string) $cat->category_name,
                'revenue' => $rev,
                'units_sold' => (int) $cat->units_sold,
                'percentage' => $pct,
            ];
        })->values()->all();
    }

    /**
     * Top productos líderes en facturación dentro del período.
     */
    public function getTopProducts(array $dateRange, int $limit = 5, ?string $sucursal = null): array
    {
        $query = DB::table('detfct as d')
            ->join('encfct as e', 'd.id_fac', '=', 'e.id_fac')
            ->join('productos as p', DB::raw('RTRIM(d.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
            ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $query->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($query, $dateRange, 'e.fecfct');

        $top = $query
            ->selectRaw('
                RTRIM(p.codprd) as product_id,
                RTRIM(p.nomprd) as product_name,
                RTRIM(COALESCE(r.nomrub, \'GENERAL\')) as category_name,
                ROUND(SUM(CAST(d.qtyvta as float) * CAST(d.prcact as float)), 2) as revenue,
                ROUND(SUM(CAST(d.qtyvta as float)), 0) as units_sold
            ')
            ->groupBy(
                DB::raw('RTRIM(p.codprd)'),
                DB::raw('RTRIM(p.nomprd)'),
                DB::raw('RTRIM(COALESCE(r.nomrub, \'GENERAL\'))')
            )
            ->orderByDesc('revenue')
            ->take($limit)
            ->get();

        $codes = $top->pluck('product_id')->all();
        $stockQuery = DB::table('existencias')
            ->whereIn(DB::raw('RTRIM(codprd)'), $codes);

        if (! empty($sucursal)) {
            if ($sucursal === '003') {
                $stockQuery->where(DB::raw('RTRIM(codbod)'), '003');
            } elseif ($sucursal === '001') {
                $stockQuery->where(DB::raw('RTRIM(codbod)'), '!=', '003');
            }
        }

        $stockMap = $stockQuery
            ->groupBy(DB::raw('RTRIM(codprd)'))
            ->selectRaw('RTRIM(codprd) as cod, ROUND(SUM(CAST(exiprd as float)), 0) as total_stock')
            ->pluck('total_stock', 'cod');

        return $top->map(function ($p) use ($stockMap) {
            $cod = (string) $p->product_id;

            return [
                'product_id' => $cod,
                'product_name' => (string) $p->product_name,
                'category_name' => (string) $p->category_name,
                'revenue' => (float) $p->revenue,
                'units_sold' => (int) $p->units_sold,
                'units_in_stock' => (int) ($stockMap[$cod] ?? 0),
            ];
        })->values()->all();
    }

    /**
     * Distribución por Fuerza de Ventas / Asesores Comerciales.
     */
    public function getCommercialForceDistribution(array $dateRange, int $limit = 6, ?string $sucursal = null): array
    {
        $query = DB::table('encfct as e')
            ->leftJoin('vendedores as v', DB::raw('RTRIM(e.codven)'), '=', DB::raw('RTRIM(v.codven)'))
            ->where('e.estado', '!=', 'A');

        if (! empty($sucursal)) {
            $query->where(DB::raw('RTRIM(e.codsuc)'), $sucursal);
        }

        $this->applyDateFilter($query, $dateRange, 'e.fecfct');

        return $query
            ->selectRaw('
                RTRIM(COALESCE(v.nomven, e.codven, \'OFICINA\')) as country,
                ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as revenue,
                COUNT(DISTINCT e.id_fac) as orders_count
            ')
            ->groupBy(DB::raw('RTRIM(COALESCE(v.nomven, e.codven, \'OFICINA\'))'))
            ->orderByDesc('revenue')
            ->take($limit)
            ->get()
            ->map(fn ($row) => [
                'country' => (string) $row->country,
                'revenue' => (float) $row->revenue,
                'orders_count' => (int) $row->orders_count,
            ])
            ->values()
            ->all();
    }

    /**
     * Facturas más recientes dentro del período.
     */
    public function getRecentOrders(array $dateRange, int $limit = 6): array
    {
        $query = DB::table('encfct as e')
            ->leftJoin('vendedores as v', DB::raw('RTRIM(e.codven)'), '=', DB::raw('RTRIM(v.codven)'))
            ->where('e.estado', '!=', 'A');

        $this->applyDateFilter($query, $dateRange, 'e.fecfct');

        $invoices = $query
            ->selectRaw('
                e.id_fac,
                RTRIM(e.numfct) as numfct,
                RTRIM(e.tipfct) as tipfct,
                RTRIM(COALESCE(e.shipto, \'Cliente\')) as customer_name,
                e.fecfct,
                RTRIM(COALESCE(v.nomven, e.codven, \'OFIC\')) as seller_name,
                ROUND(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float), 2) as total_amount
            ')
            ->orderByDesc('e.fecfct')
            ->take($limit)
            ->get();

        $ids = $invoices->pluck('id_fac')->all();
        $linesCount = DB::table('detfct')
            ->whereIn('id_fac', $ids)
            ->groupBy('id_fac')
            ->selectRaw('id_fac, COUNT(*) as cant')
            ->pluck('cant', 'id_fac');

        return $invoices->map(function ($inv) use ($linesCount) {
            $carbon = Carbon::parse($inv->fecfct);
            $tipo = $inv->tipfct === 'CF' ? 'Créd. Fiscal' : ($inv->tipfct === 'FC' ? 'Factura' : $inv->tipfct);

            return [
                'order_id' => trim($inv->numfct),
                'customer_id' => (string) $inv->customer_name,
                'order_date' => $carbon->format('d/m/Y'),
                'ship_country' => "{$tipo} • {$inv->seller_name}",
                'items_count' => (int) ($linesCount[$inv->id_fac] ?? 1),
                'total_amount' => (float) $inv->total_amount,
            ];
        })->values()->all();
    }

    /**
     * Alertas de productos con stock en quiebre o agotados.
     */
    public function getLowStockAlerts(int $limit = 6): array
    {
        $alerts = DB::table('existencias as ex')
            ->join('productos as p', DB::raw('RTRIM(ex.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
            ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
            ->where('p.estado', 'A')
            ->groupBy(
                DB::raw('RTRIM(p.codprd)'),
                DB::raw('RTRIM(p.nomprd)'),
                DB::raw('RTRIM(COALESCE(r.nomrub, \'General\'))')
            )
            ->havingRaw('SUM(CAST(ex.exiprd as float)) <= 0')
            ->selectRaw('
                RTRIM(p.codprd) as product_id,
                RTRIM(p.nomprd) as product_name,
                RTRIM(COALESCE(r.nomrub, \'General\')) as category_name,
                ROUND(SUM(CAST(ex.exiprd as float)), 0) as units_in_stock
            ')
            ->orderBy('units_in_stock', 'asc')
            ->take($limit)
            ->get();

        return $alerts->map(fn ($p) => [
            'product_id' => (string) $p->product_id,
            'product_name' => (string) $p->product_name,
            'category_name' => (string) $p->category_name,
            'units_in_stock' => (int) $p->units_in_stock,
            'reorder_level' => 10,
            'units_on_order' => 0,
            'is_out_of_stock' => (int) $p->units_in_stock <= 0,
        ])->values()->all();
    }

    /**
     * Módulo 1: Comparativa Interanual (YoY - Year over Year) 2026 vs 2025.
     */
    public function getYearOverYearComparison(?string $sucursal = null): array
    {
        $mesesNombres = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
        ];

        $sucursalCondition = '';
        if (! empty($sucursal)) {
            $safeSucursal = addslashes($sucursal);
            $sucursalCondition = "AND RTRIM(codsuc) = '{$safeSucursal}'";
        }

        $yoyData = DB::select("
            WITH Ventas2025 AS (
                SELECT 
                    MONTH(fecfct) as mes_num,
                    ROUND(SUM(CAST(valgrv as float) + CAST(valexe as float)), 2) as venta_2025,
                    COUNT(DISTINCT id_fac) as facturas_2025
                FROM encfct
                WHERE estado != 'A' AND YEAR(fecfct) = 2025 {$sucursalCondition}
                GROUP BY MONTH(fecfct)
            ),
            Ventas2026 AS (
                SELECT 
                    MONTH(fecfct) as mes_num,
                    ROUND(SUM(CAST(valgrv as float) + CAST(valexe as float)), 2) as venta_2026,
                    COUNT(DISTINCT id_fac) as facturas_2026
                FROM encfct
                WHERE estado != 'A' AND YEAR(fecfct) = 2026 {$sucursalCondition}
                GROUP BY MONTH(fecfct)
            )
            SELECT 
                m.mes_num,
                COALESCE(v25.venta_2025, 0) as venta_2025,
                COALESCE(v26.venta_2026, 0) as venta_2026,
                COALESCE(v25.facturas_2025, 0) as facturas_2025,
                COALESCE(v26.facturas_2026, 0) as facturas_2026,
                ROUND(COALESCE(v26.venta_2026, 0) - COALESCE(v25.venta_2025, 0), 2) as diff_monto,
                CASE 
                    WHEN COALESCE(v25.venta_2025, 0) > 0 THEN 
                        ROUND(((COALESCE(v26.venta_2026, 0) - v25.venta_2025) / v25.venta_2025) * 100, 1)
                    ELSE 0 
                END as diff_pct
            FROM (
                SELECT DISTINCT MONTH(fecfct) as mes_num FROM encfct WHERE YEAR(fecfct) IN (2025, 2026)
            ) m
            LEFT JOIN Ventas2025 v25 ON m.mes_num = v25.mes_num
            LEFT JOIN Ventas2026 v26 ON m.mes_num = v26.mes_num
            ORDER BY m.mes_num ASC
        ");

        $monthly = [];
        $totalVenta2025Ytd = 0.0;
        $totalVenta2026Ytd = 0.0;
        $totalFacturas2025Ytd = 0;
        $totalFacturas2026Ytd = 0;

        foreach ($yoyData as $row) {
            $mesNum = (int) $row->mes_num;
            $v25 = (float) $row->venta_2025;
            $v26 = (float) $row->venta_2026;
            $f25 = (int) $row->facturas_2025;
            $f26 = (int) $row->facturas_2026;

            // Acumulamos YTD solo para los meses que 2026 tiene actividad (meses 1 a 10)
            if ($mesNum <= 10) {
                $totalVenta2025Ytd += $v25;
                $totalVenta2026Ytd += $v26;
                $totalFacturas2025Ytd += $f25;
                $totalFacturas2026Ytd += $f26;
            }

            $monthly[] = [
                'mes_num' => $mesNum,
                'mes_nombre' => $mesesNombres[$mesNum] ?? "Mes $mesNum",
                'venta_2025' => $v25,
                'venta_2026' => $v26,
                'facturas_2025' => $f25,
                'facturas_2026' => $f26,
                'diff_monto' => (float) $row->diff_monto,
                'diff_pct' => (float) $row->diff_pct,
                'has_data_2026' => $mesNum <= 10,
            ];
        }

        $ytdDiffAmount = round($totalVenta2026Ytd - $totalVenta2025Ytd, 2);
        $ytdDiffPct = $totalVenta2025Ytd > 0
            ? round(($ytdDiffAmount / $totalVenta2025Ytd) * 100, 1)
            : 0.0;

        $invoicesDiffPct = $totalFacturas2025Ytd > 0
            ? round((($totalFacturas2026Ytd - $totalFacturas2025Ytd) / $totalFacturas2025Ytd) * 100, 1)
            : 0.0;

        return [
            'summary' => [
                'ytd_2026_revenue' => round($totalVenta2026Ytd, 2),
                'ytd_2025_revenue' => round($totalVenta2025Ytd, 2),
                'diff_amount' => $ytdDiffAmount,
                'diff_pct' => $ytdDiffPct,
                'ytd_2026_invoices' => $totalFacturas2026Ytd,
                'ytd_2025_invoices' => $totalFacturas2025Ytd,
                'invoices_growth_pct' => $invoicesDiffPct,
            ],
            'monthly' => $monthly,
        ];
    }

    /**
     * Módulo 2: Matriz de Clientes, Cuentas por Cobrar (CxC) y Cartera.
     */
    public function getAccountsReceivableAndClientMatrix(?string $sucursal = null): array
    {
        $sucursalCondition = '';
        if (! empty($sucursal)) {
            $safeSucursal = addslashes($sucursal);
            $sucursalCondition = "AND RTRIM(e.codsuc) = '{$safeSucursal}'";
        }

        $isPgsql = DB::connection()->getDriverName() === 'pgsql';
        $diffVen = $isPgsql ? "(CAST('2026-10-13' AS date) - CAST(e.fecven AS date))" : "DATEDIFF(day, e.fecven, CAST('2026-10-13' AS date))";
        $diffFct = $isPgsql ? "(CAST('2026-10-13' AS date) - CAST(MAX(e.fecfct) AS date))" : "DATEDIFF(day, MAX(e.fecfct), CAST('2026-10-13' AS date))";
        $top6Select = $isPgsql ? 'SELECT' : 'SELECT TOP 6';
        $limit6 = $isPgsql ? 'LIMIT 6' : '';
        $top5Select = $isPgsql ? 'SELECT' : 'SELECT TOP 5';
        $limit5 = $isPgsql ? 'LIMIT 5' : '';

        // 1. Envejecimiento de Cartera (Aging)
        $agingRows = DB::select("
            WITH Cartera AS (
                SELECT 
                    e.id_fac,
                    {$diffVen} as dias_mora,
                    ROUND(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - COALESCE(p.total_pagado, 0), 2) as saldo
                FROM encfct e
                LEFT JOIN (
                    SELECT id_fac, SUM(CAST(valmov as float)) as total_pagado
                    FROM movcxc
                    GROUP BY id_fac
                ) p ON e.id_fac = p.id_fac
                WHERE e.estado != 'A' AND e.condpgo = 'CRD' {$sucursalCondition}
                AND (CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - COALESCE(p.total_pagado, 0)) > 0.05
            )
            SELECT 
                CASE 
                    WHEN dias_mora <= 0 THEN 'Corriente / Al Día'
                    WHEN dias_mora BETWEEN 1 AND 30 THEN '1 - 30 días'
                    WHEN dias_mora BETWEEN 31 AND 60 THEN '31 - 60 días'
                    WHEN dias_mora BETWEEN 61 AND 90 THEN '61 - 90 días'
                    ELSE 'Más de 90 días'
                END as tramo,
                COUNT(*) as facturas,
                ROUND(SUM(saldo), 2) as total_saldo
            FROM Cartera
            GROUP BY 
                CASE 
                    WHEN dias_mora <= 0 THEN 'Corriente / Al Día'
                    WHEN dias_mora BETWEEN 1 AND 30 THEN '1 - 30 días'
                    WHEN dias_mora BETWEEN 31 AND 60 THEN '31 - 60 días'
                    WHEN dias_mora BETWEEN 61 AND 90 THEN '61 - 90 días'
                    ELSE 'Más de 90 días'
                END
        ");

        $totalPortfolio = 0.0;
        $agingMap = [
            'Corriente / Al Día' => ['saldo' => 0.0, 'facturas' => 0, 'badge' => 'emerald'],
            '1 - 30 días' => ['saldo' => 0.0, 'facturas' => 0, 'badge' => 'sky'],
            '31 - 60 días' => ['saldo' => 0.0, 'facturas' => 0, 'badge' => 'indigo'],
            '61 - 90 días' => ['saldo' => 0.0, 'facturas' => 0, 'badge' => 'amber'],
            'Más de 90 días' => ['saldo' => 0.0, 'facturas' => 0, 'badge' => 'rose'],
        ];

        foreach ($agingRows as $r) {
            $saldo = (float) $r->total_saldo;
            $fCount = (int) $r->facturas;
            $tramo = trim($r->tramo);
            if (isset($agingMap[$tramo])) {
                $agingMap[$tramo]['saldo'] = $saldo;
                $agingMap[$tramo]['facturas'] = $fCount;
            }
            $totalPortfolio += $saldo;
        }

        $agingList = [];
        foreach ($agingMap as $key => $val) {
            $pct = $totalPortfolio > 0 ? round(($val['saldo'] / $totalPortfolio) * 100, 1) : 0.0;
            $agingList[] = [
                'tramo' => $key,
                'saldo' => $val['saldo'],
                'facturas' => $val['facturas'],
                'porcentaje' => $pct,
                'color' => $val['badge'],
            ];
        }

        $currentBalance = $agingMap['Corriente / Al Día']['saldo'];
        $overdueBalance = round($totalPortfolio - $currentBalance, 2);
        $overduePlus90 = $agingMap['Más de 90 días']['saldo'];
        $overdueRate = $totalPortfolio > 0 ? round(($overdueBalance / $totalPortfolio) * 100, 1) : 0.0;
        $totalPendingInvoices = array_sum(array_column($agingList, 'facturas'));

        // 2. Top Deudores de Cartera
        $topDebtors = DB::select("
            WITH Cartera AS (
                SELECT 
                    e.id_fac,
                    RTRIM(e.codcli) as codcli,
                    RTRIM(COALESCE(e.shipto, c.nomcli)) as nomcli,
                    RTRIM(COALESCE(v.nomven, e.codven, 'OFIC')) as nomven,
                    {$diffVen} as dias_mora,
                    ROUND(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - COALESCE(p.total_pagado, 0), 2) as saldo
                FROM encfct e
                INNER JOIN clientes c ON RTRIM(e.codcli) = RTRIM(c.codcli)
                LEFT JOIN vendedores v ON RTRIM(e.codven) = RTRIM(v.codven)
                LEFT JOIN (
                    SELECT id_fac, SUM(CAST(valmov as float)) as total_pagado
                    FROM movcxc
                    GROUP BY id_fac
                ) p ON e.id_fac = p.id_fac
                WHERE e.estado != 'A' AND e.condpgo = 'CRD' {$sucursalCondition}
                AND (CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - COALESCE(p.total_pagado, 0)) > 0.05
            )
            {$top6Select}
                codcli,
                nomcli,
                nomven,
                COUNT(*) as facturas_pendientes,
                MAX(dias_mora) as max_dias_mora,
                ROUND(SUM(saldo), 2) as saldo_total
            FROM Cartera
            GROUP BY codcli, nomcli, nomven
            ORDER BY saldo_total DESC
            {$limit6}
        ");

        $formattedDebtors = array_map(fn ($d) => [
            'codcli' => (string) $d->codcli,
            'nomcli' => (string) $d->nomcli,
            'nomven' => (string) $d->nomven,
            'facturas_pendientes' => (int) $d->facturas_pendientes,
            'max_dias_mora' => (int) $d->max_dias_mora,
            'saldo_total' => (float) $d->saldo_total,
            'risk_level' => ((int) $d->max_dias_mora) > 90 ? 'Crítico (+90d)' : (((int) $d->max_dias_mora) > 30 ? 'Medio' : 'Al día'),
        ], $topDebtors);

        // 3. Matriz de Clientes Principales (Valor acumulado & Frecuencia)
        $topClients = DB::select("
            WITH ClientesStats AS (
                SELECT 
                    RTRIM(e.codcli) as codcli,
                    RTRIM(COALESCE(e.shipto, c.nomcli)) as nomcli,
                    RTRIM(COALESCE(v.nomven, e.codven, 'OFIC')) as nomven,
                    MAX(e.fecfct) as ultima_compra,
                    {$diffFct} as dias_sin_comprar,
                    COUNT(DISTINCT e.id_fac) as total_facturas,
                    ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as compras_totales
                FROM encfct e
                INNER JOIN clientes c ON RTRIM(e.codcli) = RTRIM(c.codcli)
                LEFT JOIN vendedores v ON RTRIM(e.codven) = RTRIM(v.codven)
                WHERE e.estado != 'A' {$sucursalCondition}
                GROUP BY e.codcli, COALESCE(e.shipto, c.nomcli), COALESCE(v.nomven, e.codven, 'OFIC')
            ),
            Saldos AS (
                SELECT 
                    RTRIM(e.codcli) as codcli,
                    ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - COALESCE(p.total_pagado, 0)), 2) as saldo_deuda,
                    MAX({$diffVen}) as max_mora
                FROM encfct e
                LEFT JOIN (
                    SELECT id_fac, SUM(CAST(valmov as float)) as total_pagado
                    FROM movcxc
                    GROUP BY id_fac
                ) p ON e.id_fac = p.id_fac
                WHERE e.estado != 'A' AND e.condpgo = 'CRD' {$sucursalCondition}
                GROUP BY e.codcli
                HAVING SUM(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - COALESCE(p.total_pagado, 0)) > 0.05
            )
            {$top6Select}
                cs.codcli,
                cs.nomcli,
                cs.nomven,
                cs.ultima_compra,
                cs.dias_sin_comprar,
                cs.total_facturas,
                cs.compras_totales,
                COALESCE(s.saldo_deuda, 0) as saldo_deuda,
                COALESCE(s.max_mora, 0) as max_mora
            FROM ClientesStats cs
            LEFT JOIN Saldos s ON cs.codcli = s.codcli
            ORDER BY cs.compras_totales DESC
            {$limit6}
        ");

        $formattedTopClients = array_map(function ($c) {
            $days = (int) $c->dias_sin_comprar;
            $status = $days <= 30 ? 'Activo Frecuente' : ($days <= 90 ? 'En Seguimiento' : 'Inactivo');

            return [
                'codcli' => (string) $c->codcli,
                'nomcli' => (string) $c->nomcli,
                'nomven' => (string) $c->nomven,
                'ultima_compra' => Carbon::parse($c->ultima_compra)->format('d/m/Y'),
                'dias_sin_comprar' => $days,
                'total_facturas' => (int) $c->total_facturas,
                'compras_totales' => (float) $c->compras_totales,
                'saldo_deuda' => (float) $c->saldo_deuda,
                'status_segment' => $status,
            ];
        }, $topClients);

        // 4. Clientes en Riesgo de Abandono (Compraron en 2025/2026 pero llevan entre 45 y 120 días sin facturar)
        $churnRisk = DB::select("
            WITH ClientesRecientes AS (
                SELECT 
                    RTRIM(e.codcli) as codcli,
                    RTRIM(COALESCE(e.shipto, c.nomcli)) as nomcli,
                    RTRIM(COALESCE(v.nomven, e.codven, 'OFIC')) as nomven,
                    MAX(e.fecfct) as ultima_compra,
                    {$diffFct} as dias_sin_comprar,
                    ROUND(SUM(CAST(e.valgrv as float) + CAST(e.valexe as float)), 2) as compras_totales,
                    COUNT(DISTINCT e.id_fac) as facturas_total
                FROM encfct e
                INNER JOIN clientes c ON RTRIM(e.codcli) = RTRIM(c.codcli)
                LEFT JOIN vendedores v ON RTRIM(e.codven) = RTRIM(v.codven)
                WHERE e.estado != 'A' AND YEAR(e.fecfct) >= 2025 {$sucursalCondition}
                GROUP BY e.codcli, COALESCE(e.shipto, c.nomcli), COALESCE(v.nomven, e.codven, 'OFIC')
                HAVING {$diffFct} BETWEEN 45 AND 150
            )
            {$top5Select} *
            FROM ClientesRecientes
            ORDER BY compras_totales DESC
            {$limit5}
        ");

        $formattedChurnRisk = array_map(fn ($cr) => [
            'codcli' => (string) $cr->codcli,
            'nomcli' => (string) $cr->nomcli,
            'nomven' => (string) $cr->nomven,
            'ultima_compra' => Carbon::parse($cr->ultima_compra)->format('d/m/Y'),
            'dias_sin_comprar' => (int) $cr->dias_sin_comprar,
            'compras_totales' => (float) $cr->compras_totales,
            'facturas_total' => (int) $cr->facturas_total,
        ], $churnRisk);

        return [
            'kpis' => [
                'total_portfolio' => round($totalPortfolio, 2),
                'current_portfolio' => round($currentBalance, 2),
                'overdue_portfolio' => $overdueBalance,
                'overdue_plus_90' => $overduePlus90,
                'overdue_rate' => $overdueRate,
                'total_pending_invoices' => $totalPendingInvoices,
            ],
            'aging_distribution' => $agingList,
            'top_debtors' => $formattedDebtors,
            'top_clients' => $formattedTopClients,
            'churn_risk_clients' => $formattedChurnRisk,
        ];
    }

    /**
     * Módulo 3: Semáforo de Abastecimiento & Cobertura de Stock Preventiva.
     */
    public function getSupplyChainTrafficLight(?string $sucursal = null): array
    {
        $sucursalSalesFilter = '';
        $sucursalStockFilter = '';
        if (! empty($sucursal)) {
            $safeSucursal = addslashes($sucursal);
            $sucursalSalesFilter = "AND RTRIM(e.codsuc) = '{$safeSucursal}'";
            if ($safeSucursal === '003') {
                $sucursalStockFilter = "WHERE RTRIM(codbod) = '003'";
            } elseif ($safeSucursal === '001') {
                $sucursalStockFilter = "WHERE RTRIM(codbod) != '003'";
            }
        }

        $items = DB::select("
            WITH VentasRecientes AS (
                SELECT 
                    RTRIM(d.codprd) as codprd,
                    SUM(CAST(d.qtyvta as float)) as unidades_6m,
                    ROUND(SUM(CAST(d.qtyvta as float)) / 6.0, 1) as consumo_mensual,
                    ROUND(SUM(CAST(d.qtyvta as float) * CAST(d.prcact as float)), 2) as venta_6m
                FROM detfct d
                INNER JOIN encfct e ON d.id_fac = e.id_fac
                WHERE e.estado != 'A' AND e.fecfct >= '2026-04-01' {$sucursalSalesFilter}
                GROUP BY d.codprd
            ),
            StockActual AS (
                SELECT 
                    RTRIM(codprd) as codprd,
                    ROUND(SUM(CAST(exiprd as float)), 0) as stock_total
                FROM existencias
                {$sucursalStockFilter}
                GROUP BY codprd
            )
            SELECT 
                RTRIM(p.codprd) as codprd,
                RTRIM(p.nomprd) as producto,
                RTRIM(COALESCE(r.nomrub, 'GENERAL')) as marca,
                RTRIM(COALESCE(p.unibas, 'UNIDAD')) as unibas,
                COALESCE(s.stock_total, 0) as stock_actual,
                v.consumo_mensual,
                v.unidades_6m,
                v.venta_6m,
                CASE 
                    WHEN COALESCE(s.stock_total, 0) <= 0 THEN 0
                    WHEN v.consumo_mensual > 0 THEN ROUND((COALESCE(s.stock_total, 0) / (v.consumo_mensual / 30.0)), 0)
                    ELSE 999
                END as dias_cobertura
            FROM VentasRecientes v
            INNER JOIN productos p ON v.codprd = RTRIM(p.codprd)
            LEFT JOIN rubros r ON RTRIM(p.codrub) = RTRIM(r.codrub)
            LEFT JOIN StockActual s ON v.codprd = s.codprd
            WHERE p.estado = 'A'
            ORDER BY v.venta_6m DESC
        ");

        $criticos = 0;
        $alertas = 0;
        $optimos = 0;
        $excesos = 0;
        $ventaEnJuegoCritica = 0.0;
        $ventaEnJuegoAlerta = 0.0;

        $processedItems = [];
        $criticosAlerts = [];
        $reordenAlerts = [];

        foreach ($items as $row) {
            $stock = (float) $row->stock_actual;
            $consumoMensual = (float) $row->consumo_mensual;
            $diasCobertura = (int) $row->dias_cobertura;
            $venta6m = (float) $row->venta_6m;

            if ($stock <= 0) {
                $estado = 'critico';
                $badge = 'rose';
                $accion = 'Quiebre Inmediato';
                $criticos++;
                $ventaEnJuegoCritica += $venta6m;
                $sugerenciaCompra = ceil($consumoMensual * 2);
            } elseif ($diasCobertura <= 30) {
                $estado = 'alerta';
                $badge = 'amber';
                $accion = 'Reorden Preventivo';
                $alertas++;
                $ventaEnJuegoAlerta += $venta6m;
                $sugerenciaCompra = ceil(($consumoMensual * 2) - $stock);
            } elseif ($diasCobertura <= 90) {
                $estado = 'optimo';
                $badge = 'emerald';
                $accion = 'Abastecido';
                $optimos++;
                $sugerenciaCompra = 0;
            } else {
                $estado = 'exceso';
                $badge = 'sky';
                $accion = 'Sobre-Stock';
                $excesos++;
                $sugerenciaCompra = 0;
            }

            $itemData = [
                'codprd' => (string) $row->codprd,
                'producto' => (string) $row->producto,
                'marca' => (string) $row->marca,
                'unibas' => (string) $row->unibas,
                'stock_actual' => (int) $stock,
                'consumo_mensual' => $consumoMensual,
                'dias_cobertura' => $diasCobertura,
                'venta_6m' => $venta6m,
                'estado' => $estado,
                'badge' => $badge,
                'accion' => $accion,
                'sugerencia_compra' => max(0, (int) $sugerenciaCompra),
            ];

            $processedItems[] = $itemData;

            if ($estado === 'critico' && count($criticosAlerts) < 2 && $venta6m > 10000) {
                $criticosAlerts[] = [
                    'tipo' => 'quiebre',
                    'producto' => (string) $row->producto,
                    'marca' => (string) $row->marca,
                    'mensaje' => "Stock agotado ({$stock} {$row->unibas}). Ritmo de salida mensual de {$consumoMensual} {$row->unibas}. Ventas semestrales en riesgo: ".number_format($venta6m, 2).' USD.',
                    'dias_restantes' => 0,
                    'sugerencia' => "Emitir orden urgente por {$sugerenciaCompra} {$row->unibas}",
                    'nivel' => 'urgente',
                ];
            } elseif ($estado === 'alerta' && count($reordenAlerts) < 2) {
                $reordenAlerts[] = [
                    'tipo' => 'reorden',
                    'producto' => (string) $row->producto,
                    'marca' => (string) $row->marca,
                    'mensaje' => "Quedan solo {$diasCobertura} días de cobertura ({$stock} {$row->unibas} en bodega) para un ritmo de {$consumoMensual} {$row->unibas}/mes.",
                    'dias_restantes' => $diasCobertura,
                    'sugerencia' => "Reorden preventivo: +{$sugerenciaCompra} {$row->unibas} antes del agotamiento",
                    'nivel' => 'alerta',
                ];
            }
        }

        $predictiveAlerts = array_merge($criticosAlerts, $reordenAlerts);

        return [
            'kpis' => [
                'total_criticos' => $criticos,
                'venta_en_juego_critica' => round($ventaEnJuegoCritica, 2),
                'total_alerta' => $alertas,
                'venta_en_juego_alerta' => round($ventaEnJuegoAlerta, 2),
                'total_optimo' => $optimos,
                'total_exceso' => $excesos,
            ],
            'predictive_alerts' => $predictiveAlerts,
            'items' => array_slice($processedItems, 0, 50),
        ];
    }
}
