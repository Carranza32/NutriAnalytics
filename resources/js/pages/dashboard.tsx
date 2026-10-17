import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    BarChart3,
    Boxes,
    Calendar,
    DollarSign,
    GitCompare,
    PackageCheck,
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

export default function Dashboard({
    period,
    available_periods,
    kpis,
    sales_trend,
    category_distribution,
    top_products,
    geo_distribution,
    recent_orders,
    low_stock_alerts,
    yoy_comparison,
    cxc_matrix,
    supply_chain,
}: DashboardProps) {
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

    const handlePeriodChange = (newPeriod: string) => {
        router.get(
            dashboard(),
            { period: newPeriod },
            {
                preserveState: true,
                preserveScroll: true,
                only: [
                    'period',
                    'kpis',
                    'sales_trend',
                    'category_distribution',
                    'top_products',
                    'geo_distribution',
                    'recent_orders',
                ],
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
                        <div className="flex items-center gap-2">
                            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                NutriAnalytics Engine • GeoSoft ERP
                            </span>
                        </div>
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

                {/* Vista 1: Resumen Ejecutivo & Ventas */}
                {currentTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Selector de Período exclusivo para Vista General */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                Filtrando datos por ejercicio contable:
                            </span>

                            <div className="flex items-center rounded-2xl border border-black/[0.06] bg-neutral-100/80 p-1.5 backdrop-blur-md dark:border-white/[0.08] dark:bg-neutral-800/80">
                                <div className="mr-1.5 flex items-center pl-2 text-neutral-400">
                                    <Calendar className="size-3.5" />
                                </div>
                                {available_periods.map((p) => {
                                    const isSelected = period === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handlePeriodChange(p.id)}
                                            className="relative rounded-xl px-3 py-1 text-xs font-medium transition-colors"
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="periodPillHighlight"
                                                    className="absolute inset-0 rounded-xl bg-white shadow-xs dark:bg-neutral-700"
                                                    transition={{
                                                        type: 'spring',
                                                        bounce: 0,
                                                        duration: 0.35,
                                                    }}
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    'relative z-10 transition-colors',
                                                    isSelected
                                                        ? 'font-semibold text-neutral-900 dark:text-neutral-50'
                                                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                                )}
                                            >
                                                {p.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

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
                                title="Productos en Quiebre / 0"
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
