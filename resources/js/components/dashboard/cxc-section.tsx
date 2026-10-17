import type { ApexOptions } from 'apexcharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
    AlertCircle,
    AlertOctagon,
    Banknote,
    Clock,
    FileSpreadsheet,
    ShieldAlert,
    TrendingDown,
    UserCheck,
    UserMinus,
    Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { DataTable } from '@/components/ui/data-table';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type {
    AccountsReceivableMatrix,
    ChurnRiskClientItem,
    DebtorClientItem,
    TopClientMatrixItem,
} from '@/types/dashboard';

interface CxCSectionProps {
    data: AccountsReceivableMatrix;
}

export function CxCSection({ data }: CxCSectionProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [activeTab, setActiveTab] = useState<'debtors' | 'churn' | 'top_clients'>('debtors');

    useEffect(() => {
        setIsMounted(true);
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const { kpis, aging_distribution, top_debtors, top_clients, churn_risk_clients } = data;

    // Columnas TanStack para Deudores
    const debtorColumns = useMemo<ColumnDef<DebtorClientItem>[]>(
        () => [
            {
                accessorKey: 'codcli',
                header: 'Código',
                cell: ({ row }) => (
                    <span className="font-mono text-[11px] text-neutral-500">
                        {row.original.codcli}
                    </span>
                ),
            },
            {
                accessorKey: 'nomcli',
                header: 'Cliente / Agroservicio',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.original.nomcli}
                    </span>
                ),
            },
            {
                accessorKey: 'nomven',
                header: 'Asesor Comercial',
                cell: ({ row }) => (
                    <span className="text-neutral-600 dark:text-neutral-400">
                        {row.original.nomven}
                    </span>
                ),
            },
            {
                accessorKey: 'facturas_pendientes',
                header: 'Facturas Pendientes',
                cell: ({ row }) => (
                    <div className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {row.original.facturas_pendientes}
                    </div>
                ),
            },
            {
                accessorKey: 'max_dias_mora',
                header: 'Días Mora Máx',
                cell: ({ row }) => {
                    const days = row.original.max_dias_mora;
                    return (
                        <div className="text-center">
                            <span
                                className={cn(
                                    'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold',
                                    days > 90
                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                )}
                            >
                                {days} días
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'saldo_total',
                header: 'Saldo Pendiente ($)',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(row.original.saldo_total)}
                    </div>
                ),
            },
        ],
        []
    );

    // Columnas TanStack para Abandono (Churn)
    const churnColumns = useMemo<ColumnDef<ChurnRiskClientItem>[]>(
        () => [
            {
                accessorKey: 'nomcli',
                header: 'Cliente',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.original.nomcli}
                    </span>
                ),
            },
            {
                accessorKey: 'nomven',
                header: 'Asesor Asignado',
                cell: ({ row }) => (
                    <span className="text-neutral-600 dark:text-neutral-400">
                        {row.original.nomven}
                    </span>
                ),
            },
            {
                accessorKey: 'ultima_compra',
                header: 'Última Compra',
                cell: ({ row }) => (
                    <span className="text-neutral-500 text-[11px]">
                        {row.original.ultima_compra}
                    </span>
                ),
            },
            {
                accessorKey: 'dias_sin_comprar',
                header: 'Inactividad',
                cell: ({ row }) => (
                    <div className="text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            {row.original.dias_sin_comprar} días
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'facturas_total',
                header: 'Facturas Totales',
                cell: ({ row }) => (
                    <div className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {row.original.facturas_total}
                    </div>
                ),
            },
            {
                accessorKey: 'compras_totales',
                header: 'Volumen Histórico ($)',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(row.original.compras_totales)}
                    </div>
                ),
            },
        ],
        []
    );

    // Columnas TanStack para Cuentas Estratégicas
    const topClientColumns = useMemo<ColumnDef<TopClientMatrixItem>[]>(
        () => [
            {
                accessorKey: 'nomcli',
                header: 'Cliente',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.original.nomcli}
                    </span>
                ),
            },
            {
                accessorKey: 'nomven',
                header: 'Asesor',
                cell: ({ row }) => (
                    <span className="text-neutral-600 dark:text-neutral-400">
                        {row.original.nomven}
                    </span>
                ),
            },
            {
                accessorKey: 'ultima_compra',
                header: 'Última Compra',
                cell: ({ row }) => (
                    <span className="text-neutral-500 text-[11px]">
                        {row.original.ultima_compra}
                    </span>
                ),
            },
            {
                accessorKey: 'status_segment',
                header: 'Segmento',
                cell: ({ row }) => (
                    <div className="text-center">
                        <span
                            className={cn(
                                'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold',
                                row.original.status_segment === 'Activo Frecuente'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            )}
                        >
                            {row.original.status_segment}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: 'saldo_deuda',
                header: 'Deuda Activa',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {row.original.saldo_deuda > 0
                            ? formatCurrency(row.original.saldo_deuda)
                            : 'Al día'}
                    </div>
                ),
            },
            {
                accessorKey: 'compras_totales',
                header: 'Ventas Acumuladas',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(row.original.compras_totales)}
                    </div>
                ),
            },
        ],
        []
    );

    // Colores para el Aging
    const AGING_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#f43f5e'];

    const agingChartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            fontFamily: 'inherit',
            toolbar: { show: false },
            background: 'transparent',
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 6,
                barHeight: '55%',
                distributed: true,
                dataLabels: {
                    position: 'bottom',
                },
            },
        },
        colors: AGING_COLORS,
        dataLabels: {
            enabled: true,
            textAnchor: 'start',
            style: {
                colors: isDark ? ['#f3f4f6'] : ['#111827'],
                fontSize: '11px',
                fontWeight: 600,
            },
            formatter: function (val, opt) {
                const idx = opt?.dataPointIndex;
                const item = idx !== undefined ? aging_distribution[idx] : undefined;
                return `${formatCurrency(Number(val))} (${item?.porcentaje ?? 0}%)`;
            },
            offsetX: 10,
        },
        xaxis: {
            categories: aging_distribution.map((a) => a.tramo),
            labels: {
                formatter: (val) => formatCurrency(Number(val)),
                style: {
                    colors: isDark ? '#a3a3a3' : '#737373',
                    fontSize: '10px',
                },
            },
            axisBorder: { show: false },
        },
        yaxis: {
            labels: {
                style: {
                    colors: isDark ? '#d4d4d4' : '#404040',
                    fontSize: '11px',
                    fontWeight: 500,
                },
            },
        },
        grid: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => formatCurrency(val),
            },
        },
        legend: { show: false },
    };

    const agingSeries = [
        {
            name: 'Saldo en Cartera',
            data: aging_distribution.map((a) => a.saldo),
        },
    ];

    return (
        <div className="space-y-6">
            {/* KPIs Ejecutivos de Cobranza */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Saldo Total en Cartera (CxC)
                        </span>
                        <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                            <Banknote className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatCurrency(kpis.total_portfolio)}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{formatNumber(kpis.total_pending_invoices)} facturas de crédito pendientes</span>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Cartera Corriente (Al Día)
                        </span>
                        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <UserCheck className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(kpis.current_portfolio)}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Dentro del plazo de crédito acordado</span>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Mora Crítica (+90 Días)
                        </span>
                        <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                            <AlertOctagon className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            {formatCurrency(kpis.overdue_plus_90)}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {formatCurrency(kpis.overdue_portfolio)}
                        </span>
                        <span>mora vencida total</span>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Índice de Cartera Vencida
                        </span>
                        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <TrendingDown className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                            {kpis.overdue_rate}%
                        </span>
                        <span className="text-xs text-neutral-500">del total a cobrar</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Requiere gestión activa de cobro</span>
                    </div>
                </div>
            </div>

            {/* Gráfico de Envejecimiento de la Deuda (Aging) */}
            <div className="relative rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="size-4.5 text-indigo-500 dark:text-indigo-400" />
                            <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                                Envejecimiento de Cartera (Aging de Cobranza)
                            </h2>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Distribución de los saldos por vencer y tramos de mora según fecha de vencimiento
                        </p>
                    </div>
                </div>

                <div className="mt-4 min-h-[260px]">
                    {isMounted ? (
                        <Chart
                            options={agingChartOptions}
                            series={agingSeries}
                            type="bar"
                            height={260}
                        />
                    ) : (
                        <div className="flex h-[260px] items-center justify-center text-xs text-neutral-400">
                            Cargando análisis de cartera...
                        </div>
                    )}
                </div>

                {/* Resumen en pastillas inferiores */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-black/[0.05] pt-3 dark:border-white/[0.05]">
                    {aging_distribution.map((item) => (
                        <div
                            key={item.tramo}
                            className="inline-flex items-center gap-2 rounded-xl bg-neutral-100/80 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-200"
                        >
                            <span className="font-semibold">{item.tramo}:</span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                                {formatCurrency(item.saldo)} ({item.facturas} facturas)
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selector de Vistas de la Matriz de Clientes */}
            <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Matriz de Gestión de Clientes
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Auditoría de riesgos, principales cuentas por cobrar y alertas de retención
                        </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-black/[0.06] bg-neutral-100/80 p-1 dark:border-white/[0.08] dark:bg-neutral-800/80">
                        <button
                            type="button"
                            onClick={() => setActiveTab('debtors')}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                activeTab === 'debtors'
                                    ? 'bg-white font-semibold text-rose-600 shadow-xs dark:bg-neutral-700 dark:text-rose-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            Top Deudores en Mora
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('churn')}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                activeTab === 'churn'
                                    ? 'bg-white font-semibold text-amber-600 shadow-xs dark:bg-neutral-700 dark:text-amber-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            Alerta Abandono (+45d)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('top_clients')}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                activeTab === 'top_clients'
                                    ? 'bg-white font-semibold text-indigo-600 shadow-xs dark:bg-neutral-700 dark:text-indigo-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            Cuentas Estratégicas
                        </button>
                    </div>
                </div>

                {/* Tabla 1: Top Deudores */}
                {activeTab === 'debtors' && (
                    <div className="mt-4">
                        <DataTable
                            columns={debtorColumns}
                            data={top_debtors}
                            searchPlaceholder="Buscar por cliente, asesor o código..."
                            initialPageSize={10}
                        />
                    </div>
                )}

                {/* Tabla 2: Alerta de Abandono Comercial */}
                {activeTab === 'churn' && (
                    <div className="mt-4">
                        <DataTable
                            columns={churnColumns}
                            data={churn_risk_clients}
                            searchPlaceholder="Buscar cliente o asesor asignado..."
                            initialPageSize={10}
                        />
                    </div>
                )}

                {/* Tabla 3: Cuentas Estratégicas (Top Clientes) */}
                {activeTab === 'top_clients' && (
                    <div className="mt-4">
                        <DataTable
                            columns={topClientColumns}
                            data={top_clients}
                            searchPlaceholder="Buscar cliente estratégico..."
                            initialPageSize={10}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
