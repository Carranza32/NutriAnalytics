import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    BarChart3,
    Boxes,
    Building2,
    Calendar,
    DollarSign,
    GitCompare,
    PackageCheck,
    RefreshCw,
    ShoppingBag,
    Users2,
} from 'lucide-react';
import React, { useState } from 'react';
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart';
import { CxCSection } from '@/components/dashboard/cxc-section';
import { GeoDistributionChart } from '@/components/dashboard/geo-distribution-chart';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { SupplySection } from '@/components/dashboard/supply-section';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { YoYSection } from '@/components/dashboard/yoy-section';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { DashboardProps } from '@/types/dashboard';

type DashboardTab = 'overview' | 'yoy' | 'cxc' | 'supply';

function formatLastUpdated(isoString?: string): string {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('es-SV', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return '';
    }
}

export default function Dashboard({
    period,
    available_periods,
    sucursal,
    available_sucursales,
    kpis,
    sales_trend,
    category_distribution,
    top_products,
    geo_distribution,
    yoy_comparison,
    cxc_matrix,
    supply_chain,
    last_updated,
}: DashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentTab, setCurrentTab] = useState<DashboardTab>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const t = params.get('tab') as DashboardTab;
            if (t && ['overview', 'yoy', 'cxc', 'supply'].includes(t)) {
                return t;
            }
        }
        return 'overview';
    });

    const switchTab = (tab: DashboardTab) => {
        setCurrentTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleSucursalChange = (newSucursal: string) => {
        router.get(
            dashboard(),
            {
                period,
                sucursal: newSucursal,
                tab: currentTab,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handlePeriodChange = (newPeriod: string) => {
        router.get(
            dashboard(),
            {
                period: newPeriod,
                sucursal: sucursal || 'all',
                tab: currentTab,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get(
            dashboard(),
            {
                period,
                sucursal: sucursal || 'all',
                tab: currentTab,
                refresh: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setIsRefreshing(false);
                    if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('refresh');
                        window.history.replaceState({}, '', url.toString());
                    }
                },
            }
        );
    };

    return (
        <>
            <Head title="Dashboard Analítico Empresarial" />

            <div className="flex min-h-screen flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header Superior con Estética Apple */}
                <header className="flex flex-col justify-between gap-4 border-b border-black/[0.06] pb-5 lg:flex-row lg:items-center dark:border-white/[0.06]">
                    <div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
                            Centro de Inteligencia Empresarial
                        </h1>
                        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                            Monitoreo de ingresos, comparativa interanual y matriz de riesgo de clientes
                        </p>
                    </div>

                    {/* Segmented Control de Pestañas Principales (Apple Style) */}
                    <div className="flex flex-wrap items-center gap-2 self-start rounded-2xl border border-black/[0.06] bg-neutral-100/80 p-1.5 backdrop-blur-md lg:self-auto dark:border-white/[0.08] dark:bg-neutral-800/80">
                        <button
                            type="button"
                            onClick={() => switchTab('overview')}
                            className="relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors"
                        >
                            {currentTab === 'overview' && (
                                <motion.div
                                    layoutId="mainTabIndicator"
                                    className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-neutral-700"
                                    transition={{
                                        type: 'spring',
                                        bounce: 0,
                                        duration: 0.35,
                                    }}
                                />
                            )}
                            <BarChart3 className="relative z-10 size-3.5" />
                            <span
                                className={cn(
                                    'relative z-10 transition-colors',
                                    currentTab === 'overview'
                                        ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                )}
                            >
                                Resumen Ejecutivo
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => switchTab('yoy')}
                            className="relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors"
                        >
                            {currentTab === 'yoy' && (
                                <motion.div
                                    layoutId="mainTabIndicator"
                                    className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-neutral-700"
                                    transition={{
                                        type: 'spring',
                                        bounce: 0,
                                        duration: 0.35,
                                    }}
                                />
                            )}
                            <GitCompare className="relative z-10 size-3.5" />
                            <span
                                className={cn(
                                    'relative z-10 transition-colors',
                                    currentTab === 'yoy'
                                        ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                )}
                            >
                                Comparativa YoY
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => switchTab('cxc')}
                            className="relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors"
                        >
                            {currentTab === 'cxc' && (
                                <motion.div
                                    layoutId="mainTabIndicator"
                                    className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-neutral-700"
                                    transition={{
                                        type: 'spring',
                                        bounce: 0,
                                        duration: 0.35,
                                    }}
                                />
                            )}
                            <Users2 className="relative z-10 size-3.5" />
                            <span
                                className={cn(
                                    'relative z-10 transition-colors',
                                    currentTab === 'cxc'
                                        ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                )}
                            >
                                Clientes & Cobranza
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => switchTab('supply')}
                            className="relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors"
                        >
                            {currentTab === 'supply' && (
                                <motion.div
                                    layoutId="mainTabIndicator"
                                    className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-neutral-700"
                                    transition={{
                                        type: 'spring',
                                        bounce: 0,
                                        duration: 0.35,
                                    }}
                                />
                            )}
                            <Boxes className="relative z-10 size-3.5" />
                            <span
                                className={cn(
                                    'relative z-10 transition-colors',
                                    currentTab === 'supply'
                                        ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                )}
                            >
                                Abastecimiento & Stock
                            </span>
                        </button>
                    </div>
                </header>

                {/* Barra Global de Control: Selector de Sucursal & Ejercicio Contable (Apple Toolbar) */}
                <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white/70 p-3.5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-neutral-900/70">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 pl-1">
                            <Building2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                Sucursal:
                            </span>
                        </div>

                        {/* Dropdown de Sucursales estilizado Apple */}
                        <div className="relative">
                            <select
                                value={sucursal || 'all'}
                                onChange={(e) => handleSucursalChange(e.target.value)}
                                className="h-9 cursor-pointer rounded-xl border border-black/[0.08] bg-neutral-100/90 px-3 py-1.5 pr-8 text-xs font-semibold text-neutral-900 transition-all hover:bg-neutral-200/80 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/[0.1] dark:bg-neutral-800/90 dark:text-neutral-100 dark:hover:bg-neutral-700"
                            >
                                {available_sucursales.map((s) => (
                                    <option
                                        key={s.id}
                                        value={s.id}
                                        className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                                    >
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Controles Derechos: Selector de Ejercicio Contable & Botón Actualizar Datos */}
                    <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-neutral-400">
                                <Calendar className="size-3.5" />
                                <span className="text-[11px] font-medium">Período:</span>
                            </div>
                            <div className="flex items-center rounded-xl border border-black/[0.06] bg-neutral-100/80 p-1 dark:border-white/[0.08] dark:bg-neutral-800/80">
                                {available_periods.map((p) => {
                                    const isSelected = period === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handlePeriodChange(p.id)}
                                            className={cn(
                                                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                                isSelected
                                                    ? 'bg-white font-semibold text-neutral-900 shadow-2xs dark:bg-neutral-700 dark:text-neutral-50'
                                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                            )}
                                        >
                                            {p.id === 'all' ? 'Histórico' : p.id}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Divisor vertical */}
                        <div className="hidden h-5 w-px bg-neutral-200 md:block dark:bg-neutral-800" />

                        {/* Botón de Actualizar Datos y Timestamp de Caché */}
                        <div className="flex items-center gap-2">
                            {last_updated && (
                                <span
                                    title={`Última sincronización con SQL Server: ${last_updated}`}
                                    className="hidden text-[11px] font-medium text-neutral-500 xl:inline-block dark:text-neutral-400"
                                >
                                    Caché: {formatLastUpdated(last_updated)}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                title="Forzar sincronización inmediata en tiempo real con SQL Server"
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-neutral-100/90 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-all hover:bg-neutral-200/80 hover:text-neutral-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:border-white/[0.1] dark:bg-neutral-800/90 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
                                    isRefreshing && 'opacity-80'
                                )}
                            >
                                <RefreshCw
                                    className={cn(
                                        'size-3.5 text-neutral-500 transition-transform dark:text-neutral-400',
                                        isRefreshing && 'animate-spin text-emerald-600 dark:text-emerald-400'
                                    )}
                                />
                                <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vista 1: Resumen Ejecutivo & Ventas */}
                {currentTab === 'overview' && (
                    <div className="space-y-6">

                        {/* Grid de KPIs Ejecutivos */}
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Facturación Neta"
                                value={formatCurrency(kpis.total_revenue)}
                                subtitle={`Ticket Prom: ${formatCurrency(kpis.average_order_value)}`}
                                icon={DollarSign}
                                iconColor="text-emerald-600 dark:text-emerald-400"
                                badge={{ text: 'Ingresos', variant: 'emerald' }}
                                delay={0.05}
                            />

                            <KpiCard
                                title="Facturas Emitidas"
                                value={`${formatNumber(kpis.total_orders)}`}
                                subtitle="Comprobantes fiscales válidos"
                                icon={ShoppingBag}
                                iconColor="text-blue-600 dark:text-blue-400"
                                badge={{ text: 'Ventas', variant: 'sky' }}
                                delay={0.1}
                            />

                            <KpiCard
                                title="Unidades Distribuidas"
                                value={`${formatNumber(kpis.total_units_sold)} uds`}
                                subtitle={`${kpis.active_products_count} productos activos en catálogo`}
                                icon={PackageCheck}
                                iconColor="text-indigo-600 dark:text-indigo-400"
                                badge={{ text: 'Volumen', variant: 'indigo' }}
                                delay={0.15}
                            />

                            <KpiCard
                                title="Productos en Quiebre"
                                value={`${kpis.low_stock_count}`}
                                subtitle="Artículos con stock agotado o en negativo"
                                icon={AlertCircle}
                                iconColor="text-amber-600 dark:text-amber-400"
                                badge={{
                                    text: kpis.low_stock_count > 0 ? 'Revisar bodega' : 'Óptimo',
                                    variant: kpis.low_stock_count > 0 ? 'amber' : 'emerald',
                                }}
                                delay={0.2}
                            />
                        </section>

                        {/* Fila 1 de Gráficos: Tendencia Mensual & Donut de Marcas */}
                        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <SalesTrendChart data={sales_trend} />
                            </div>
                            <div>
                                <CategoryDonutChart data={category_distribution} />
                            </div>
                        </section>

                        {/* Fila 2 de Gráficos: Top Productos & Fuerza de Ventas */}
                        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div>
                                <TopProductsChart data={top_products} />
                            </div>
                            <div>
                                <GeoDistributionChart data={geo_distribution} />
                            </div>
                        </section>
                    </div>
                )}

                {/* Vista 2: Comparativa Interanual (YoY) */}
                {currentTab === 'yoy' && (
                    <YoYSection data={yoy_comparison} />
                )}

                {/* Vista 3: Matriz de Clientes & Cobranza (CxC) */}
                {currentTab === 'cxc' && (
                    <CxCSection data={cxc_matrix} />
                )}

                {/* Vista 4: Semáforo de Abastecimiento & Quiebre Preventivo */}
                {currentTab === 'supply' && (
                    <SupplySection data={supply_chain} />
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
