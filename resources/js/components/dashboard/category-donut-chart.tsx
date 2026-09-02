import type { ApexOptions } from 'apexcharts';
import { PieChart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { formatCurrency } from '@/lib/utils';
import type { CategoryDistributionItem } from '@/types/dashboard';

interface CategoryDonutChartProps {
    data: CategoryDistributionItem[];
}

const APPLE_PALETTE = [
    '#3b82f6', // Azul
    '#10b981', // Esmeralda
    '#f59e0b', // Ámbar
    '#8b5cf6', // Violeta
    '#ec4899', // Rosa
    '#06b6d4', // Cian
    '#6366f1', // Índigo
    '#f97316', // Naranja
];

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
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

    const labels = data.map((d) => d.category_name);
    const series = data.map((d) => d.revenue);
    const totalRevenue = series.reduce((acc, curr) => acc + curr, 0);

    const chartOptions: ApexOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'inherit',
            background: 'transparent',
            animations: {
                enabled: true,
                speed: 400,
            },
        },
        labels,
        colors: APPLE_PALETTE.slice(0, data.length),
        stroke: {
            colors: isDark ? ['#171717'] : ['#ffffff'],
            width: 2,
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '12px',
                            fontWeight: 500,
                            color: isDark ? '#a3a3a3' : '#737373',
                        },
                        value: {
                            show: true,
                            fontSize: '18px',
                            fontWeight: 600,
                            color: isDark ? '#ffffff' : '#171717',
                            formatter: (val) => formatCurrency(Number(val)),
                        },
                        total: {
                            show: true,
                            label: 'Total Categorías',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: isDark ? '#a3a3a3' : '#737373',
                            formatter: () => formatCurrency(totalRevenue),
                        },
                    },
                },
            },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => formatCurrency(val),
            },
        },
    };

    return (
        <div className="relative flex flex-col justify-between rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)]">
            <div>
                <div className="flex items-center gap-2">
                    <PieChart className="size-4.5 text-indigo-500 dark:text-indigo-400" />
                    <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Ventas por Categoría
                    </h2>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Participación porcentual en facturación
                </p>

                <div className="mt-3 flex items-center justify-center min-h-[220px]">
                    {isMounted ? (
                        <Chart
                            options={chartOptions}
                            series={series}
                            type="donut"
                            height={220}
                        />
                    ) : (
                        <div className="flex h-[220px] items-center justify-center text-xs text-neutral-400">
                            Cargando...
                        </div>
                    )}
                </div>
            </div>

            {/* Listado de categorías con mini barras y porcentajes */}
            <div className="mt-4 space-y-2 border-t border-black/[0.05] pt-3 dark:border-white/[0.05]">
                {data.slice(0, 4).map((item, idx) => {
                    const color = APPLE_PALETTE[idx % APPLE_PALETTE.length];
                    return (
                        <div
                            key={item.category_id}
                            className="flex items-center justify-between text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                    {item.category_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    {formatCurrency(item.revenue)}
                                </span>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100 min-w-10">
                                    {item.percentage}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
