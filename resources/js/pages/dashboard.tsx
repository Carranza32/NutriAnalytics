import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    Calendar,
    DollarSign,
    PackageCheck,
    ShoppingBag,
} from 'lucide-react';
import React from 'react';
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart';
import { GeoDistributionChart } from '@/components/dashboard/geo-distribution-chart';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { LowStockWidget } from '@/components/dashboard/low-stock-widget';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { DashboardProps } from '@/types/dashboard';

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
}: DashboardProps) {
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
            <Head title="Dashboard Analítico" />

            <div className="flex min-h-screen flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header Superior con Estética Apple & Segmented Control */}
                <header className="flex flex-col justify-between gap-4 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-center dark:border-white/[0.06]">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                                NutriAnalytics Engine
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
                            Resumen Comercial y Operativo
                        </h1>
                        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                            Inteligencia de ventas, rotación de catálogo y alertas de inventario.
                        </p>
                    </div>

                    {/* Selector de Período estilo macOS / iOS Segmented Pill */}
                    <div className="flex items-center self-start rounded-2xl border border-black/[0.06] bg-neutral-100/80 p-1.5 backdrop-blur-md sm:self-auto dark:border-white/[0.08] dark:bg-neutral-800/80">
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
                                    className="relative rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
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
                </header>

                {/* Grid de KPIs Ejecutivos */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Facturación Total"
                        value={formatCurrency(kpis.total_revenue)}
                        subtitle={`Ticket Prom: ${formatCurrency(kpis.average_order_value)}`}
                        icon={DollarSign}
                        iconColor="text-emerald-600 dark:text-emerald-400"
                        badge={{ text: 'Ingresos', variant: 'emerald' }}
                        delay={0.05}
                    />

                    <KpiCard
                        title="Volumen de Pedidos"
                        value={`${formatNumber(kpis.total_orders)}`}
                        subtitle="Transacciones completadas"
                        icon={ShoppingBag}
                        iconColor="text-blue-600 dark:text-blue-400"
                        badge={{ text: 'Órdenes', variant: 'sky' }}
                        delay={0.1}
                    />

                    <KpiCard
                        title="Unidades Distribuidas"
                        value={`${formatNumber(kpis.total_units_sold)} uds`}
                        subtitle={`${kpis.active_products_count} productos activos`}
                        icon={PackageCheck}
                        iconColor="text-indigo-600 dark:text-indigo-400"
                        badge={{ text: 'Volumen', variant: 'indigo' }}
                        delay={0.15}
                    />

                    <KpiCard
                        title="Riesgo de Inventario"
                        value={`${kpis.low_stock_count}`}
                        subtitle="Artículos bajo umbral seguro"
                        icon={AlertCircle}
                        iconColor="text-amber-600 dark:text-amber-400"
                        badge={{
                            text: kpis.low_stock_count > 0 ? 'Acción requerida' : 'Óptimo',
                            variant: kpis.low_stock_count > 0 ? 'amber' : 'emerald',
                        }}
                        delay={0.2}
                    />
                </section>

                {/* Fila 1 de Gráficos: Tendencia Temporal & Donut de Categorías */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <SalesTrendChart data={sales_trend} />
                    </div>
                    <div>
                        <CategoryDonutChart data={category_distribution} />
                    </div>
                </section>

                {/* Fila 2 de Gráficos: Top Productos & Distribución Geográfica */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                        <TopProductsChart data={top_products} />
                    </div>
                    <div>
                        <GeoDistributionChart data={geo_distribution} />
                    </div>
                </section>

                {/* Fila 3 Operativa: Órdenes Recientes & Alertas de Inventario Crítico */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <RecentOrdersTable orders={recent_orders} />
                    </div>
                    <div>
                        <LowStockWidget alerts={low_stock_alerts} />
                    </div>
                </section>
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
