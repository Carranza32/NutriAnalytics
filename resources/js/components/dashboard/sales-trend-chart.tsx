import type { ApexOptions } from 'apexcharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { MonthlySalesPoint } from '@/types/dashboard';

interface SalesTrendChartProps {
    data: MonthlySalesPoint[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
    const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
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

    const categories = data.map((d) => d.label);
    const seriesData =
        metric === 'revenue'
            ? data.map((d) => d.revenue)
            : data.map((d) => d.orders_count);

    const series = [
        {
            name: metric === 'revenue' ? 'Facturación' : 'Pedidos',
            data: seriesData,
        },
    ];

    const chartOptions: ApexOptions = {
        chart: {
            type: 'area',
            height: 320,
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'inherit',
            animations: {
                enabled: true,
                speed: 450,
                animateGradually: { enabled: true, delay: 120 },
                dynamicAnimation: { enabled: true, speed: 300 },
            },
            background: 'transparent',
        },
        colors: metric === 'revenue' ? ['#2563eb'] : ['#10b981'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.02,
                stops: [0, 95, 100],
            },
        },
        stroke: {
            curve: 'smooth',
            width: 2.5,
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: isDark ? '#a3a3a3' : '#737373',
                    fontSize: '11px',
                    fontWeight: 400,
                },
                rotate: -25,
            },
        },
        yaxis: {
            labels: {
                formatter: (val) =>
                    metric === 'revenue' ? formatCurrency(val) : formatNumber(val),
                style: {
                    colors: isDark ? '#a3a3a3' : '#737373',
                    fontSize: '11px',
                },
            },
        },
        grid: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            strokeDashArray: 4,
            padding: { top: 10, right: 15, bottom: 0, left: 10 },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) =>
                    metric === 'revenue' ? formatCurrency(val) : `${formatNumber(val)} pedidos`,
            },
        },
    };

    return (
        <div className="relative rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="size-4.5 text-blue-500 dark:text-blue-400" />
                        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Evolución de Rendimiento
                        </h2>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Comportamiento temporal de facturación y volumen transaccional
                    </p>
                </div>

                {/* Segmented Control estilo Apple */}
                <div className="flex items-center rounded-xl bg-neutral-100/90 p-1 backdrop-blur-md dark:bg-neutral-800/90">
                    <button
                        type="button"
                        onClick={() => setMetric('revenue')}
                        className="relative rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                    >
                        {metric === 'revenue' && (
                            <motion.div
                                layoutId="salesMetricHighlight"
                                className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-neutral-700"
                                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            />
                        )}
                        <span
                            className={cn(
                                'relative z-10 transition-colors',
                                metric === 'revenue'
                                    ? 'text-neutral-900 dark:text-neutral-50 font-semibold'
                                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                            )}
                        >
                            Facturación ($)
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMetric('orders')}
                        className="relative rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                    >
                        {metric === 'orders' && (
                            <motion.div
                                layoutId="salesMetricHighlight"
                                className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-neutral-700"
                                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            />
                        )}
                        <span
                            className={cn(
                                'relative z-10 transition-colors',
                                metric === 'orders'
                                    ? 'text-neutral-900 dark:text-neutral-50 font-semibold'
                                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                            )}
                        >
                            Pedidos (cant.)
                        </span>
                    </button>
                </div>
            </div>

            <div className="mt-4 min-h-[320px]">
                {isMounted ? (
                    <Chart
                        options={chartOptions}
                        series={series}
                        type="area"
                        height={320}
                    />
                ) : (
                    <div className="flex h-[320px] items-center justify-center text-xs text-neutral-400">
                        Cargando gráfico...
                    </div>
                )}
            </div>
        </div>
    );
}
