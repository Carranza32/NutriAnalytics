import type { ApexOptions } from 'apexcharts';
import type { ColumnDef } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarRange,
    CheckCircle2,
    DollarSign,
    Layers,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { DataTable } from '@/components/ui/data-table';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { YoYComparison, YoYMonthlyPoint } from '@/types/dashboard';

interface YoYChartProps {
    data: YoYComparison;
}

export function YoYSection({ data }: YoYChartProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const checkDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkDark();

        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    const { summary, monthly } = data;
    const isPositiveGrowth = summary.diff_pct >= 0;

    const yoyColumns = useMemo<ColumnDef<YoYMonthlyPoint>[]>(
        () => [
            {
                accessorKey: 'mes_nombre',
                header: 'Mes',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {row.original.mes_nombre}
                    </span>
                ),
            },
            {
                accessorKey: 'venta_2026',
                header: 'Ventas 2026',
                cell: ({ row }) => (
                    <div className="text-right font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                        {row.original.has_data_2026 ? (
                            formatCurrency(row.original.venta_2026)
                        ) : (
                            <span className="text-neutral-400 font-normal">—</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'venta_2025',
                header: 'Ventas 2025',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {formatCurrency(row.original.venta_2025)}
                    </div>
                ),
            },
            {
                accessorKey: 'diff_monto',
                header: 'Diferencial ($)',
                cell: ({ row }) => {
                    const hasData = row.original.has_data_2026;
                    const isPositive = row.original.diff_monto >= 0;
                    return (
                        <div
                            className={cn(
                                'text-right font-semibold whitespace-nowrap',
                                !hasData
                                    ? 'text-neutral-400 font-normal'
                                    : isPositive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                            )}
                        >
                            {hasData
                                ? (isPositive && row.original.diff_monto > 0 ? '+' : '') +
                                  formatCurrency(row.original.diff_monto)
                                : '—'}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'diff_pct',
                header: 'Variación (%)',
                cell: ({ row }) => {
                    const hasData = row.original.has_data_2026;
                    const isPositive = row.original.diff_pct >= 0;
                    return (
                        <div className="text-right whitespace-nowrap">
                            {hasData ? (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-bold',
                                        isPositive
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    )}
                                >
                                    {isPositive ? (
                                        <ArrowUpRight className="size-3" />
                                    ) : (
                                        <ArrowDownRight className="size-3" />
                                    )}
                                    {row.original.diff_pct > 0
                                        ? `+${row.original.diff_pct}%`
                                        : `${row.original.diff_pct}%`}
                                </span>
                            ) : (
                                <span className="text-neutral-400 text-xs">Pendiente</span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'facturas_2026',
                header: 'Facturas 2026',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                        {row.original.has_data_2026 ? (
                            formatNumber(row.original.facturas_2026)
                        ) : (
                            <span className="text-neutral-400 font-normal">—</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'facturas_2025',
                header: 'Facturas 2025',
                cell: ({ row }) => (
                    <div className="text-right text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                        {formatNumber(row.original.facturas_2025)}
                    </div>
                ),
            },
        ],
        []
    );

    const categories = monthly.map((m) => m.mes_nombre.slice(0, 3));
    const series = [
        {
            name: 'Año 2026',
            data: monthly.map((m) => (m.has_data_2026 ? m.venta_2026 : null)),
        },
        {
            name: 'Año 2025',
            data: monthly.map((m) => m.venta_2025),
        },
    ];

    const chartOptions: ApexOptions = {
        chart: {
            type: 'area',
            fontFamily: 'inherit',
            toolbar: { show: false },
            background: 'transparent',
            animations: {
                enabled: true,
                speed: 400,
            },
        },
        colors: ['#0284c7', '#94a3b8'], // Sky-600 (2026) y Slate-400 (2025)
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.05,
                stops: [0, 95, 100],
            },
        },
        stroke: {
            curve: 'smooth',
            width: [3, 2],
            dashArray: [0, 4],
        },
        markers: {
            size: [4, 3],
            strokeWidth: 2,
            hover: { size: 6 },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories,
            labels: {
                style: {
                    colors: isDark ? '#a3a3a3' : '#737373',
                    fontSize: '11px',
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                formatter: (val) => formatCurrency(Number(val)),
                style: {
                    colors: isDark ? '#a3a3a3' : '#737373',
                    fontSize: '11px',
                },
            },
        },
        grid: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            strokeDashArray: 4,
            padding: { top: 0, right: 10, bottom: 0, left: 10 },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => (val !== null ? formatCurrency(val) : 'Sin datos aún'),
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: {
                colors: isDark ? '#d4d4d4' : '#525252',
            },
        },
    };

    return (
        <div className="space-y-6">
            {/* Tarjetas Ejecutivas de Comparativa Acumulada (YTD) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Venta Acumulada 2026 (YTD)
                        </span>
                        <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
                            <DollarSign className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatCurrency(summary.ytd_2026_revenue)}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Hasta 13 de Octubre (10 meses)</span>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Mismo Período 2025
                        </span>
                        <div className="rounded-xl bg-slate-500/10 p-2 text-slate-600 dark:text-slate-400">
                            <CalendarRange className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatCurrency(summary.ytd_2025_revenue)}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Ventas acumuladas a misma fecha</span>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Variación Facturación YoY
                        </span>
                        <div
                            className={
                                isPositiveGrowth
                                    ? 'rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400'
                                    : 'rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400'
                            }
                        >
                            {isPositiveGrowth ? (
                                <TrendingUp className="size-4" />
                            ) : (
                                <TrendingDown className="size-4" />
                            )}
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span
                            className={`text-2xl font-bold tracking-tight ${
                                isPositiveGrowth
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                            }`}
                        >
                            {summary.diff_pct > 0 ? `+${summary.diff_pct}%` : `${summary.diff_pct}%`}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            ({formatCurrency(summary.diff_amount)})
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Diferencial de ingresos interanual</span>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Volumen de Facturas Emitidas
                        </span>
                        <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                            <Layers className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(summary.ytd_2026_invoices)}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="size-3" />
                            +{summary.invoices_growth_pct}%
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>vs {formatNumber(summary.ytd_2025_invoices)} facturas en 2025</span>
                    </div>
                </div>
            </div>

            {/* Gráfico Comparativo Principal 2026 vs 2025 */}
            <div className="relative rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex size-2 rounded-full bg-sky-500" />
                            <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                                Curva de Facturación Interanual (2026 vs 2025)
                            </h2>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Compara la evolución del ciclo agrícola mes a mes para detectar patrones de estacionalidad.
                        </p>
                    </div>
                </div>

                <div className="mt-4 min-h-[300px]">
                    {isMounted ? (
                        <Chart options={chartOptions} series={series} type="area" height={300} />
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-xs text-neutral-400">
                            Cargando gráfico comparativo...
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla Mensual Detallada con Variaciones estilo DataTable */}
            <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                <div className="mb-4">
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Desglose Comparativo Mensual
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Auditoría directa de variación en ventas y facturas emitidas por cada mes del año
                    </p>
                </div>

                <DataTable
                    columns={yoyColumns}
                    data={monthly}
                    searchPlaceholder="Buscar por mes..."
                    initialPageSize={12}
                    showColumnVisibility={true}
                />
            </div>
        </div>
    );
}
