import type { ApexOptions } from 'apexcharts';
import { Award, Package } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { TopProductItem } from '@/types/dashboard';

interface TopProductsChartProps {
    data: TopProductItem[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
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

    const categories = data.map((d) => d.product_name);
    const series = [
        {
            name: 'Facturación',
            data: data.map((d) => d.revenue),
        },
    ];

    const chartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            fontFamily: 'inherit',
            toolbar: { show: false },
            background: 'transparent',
            animations: {
                enabled: true,
                speed: 400,
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 6,
                borderRadiusApplication: 'end',
                barHeight: '50%',
                distributed: false,
            },
        },
        colors: ['#0ea5e9'], // Sky blue
        dataLabels: {
            enabled: true,
            formatter: (val) => formatCurrency(Number(val)),
            style: {
                fontSize: '11px',
                fontWeight: 500,
                colors: [isDark ? '#e0f2fe' : '#0369a1'],
            },
            offsetX: 10,
        },
        xaxis: {
            categories,
            labels: {
                formatter: (val) => formatCurrency(Number(val)),
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
                style: {
                    colors: isDark ? '#d4d4d4' : '#404040',
                    fontSize: '11px',
                    fontWeight: 500,
                },
                maxWidth: 180,
            },
        },
        grid: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            strokeDashArray: 4,
            padding: { top: 0, right: 25, bottom: 0, left: 10 },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: (val) => formatCurrency(val),
            },
        },
    };

    return (
        <div className="relative rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Award className="size-4.5 text-sky-500 dark:text-sky-400" />
                        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Top Productos Estrella
                        </h2>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Artículos con mayor facturación bruta acumulada
                    </p>
                </div>
            </div>

            <div className="mt-3 min-h-[250px]">
                {isMounted ? (
                    <Chart
                        options={chartOptions}
                        series={series}
                        type="bar"
                        height={250}
                    />
                ) : (
                    <div className="flex h-[250px] items-center justify-center text-xs text-neutral-400">
                        Cargando...
                    </div>
                )}
            </div>

            {/* Fila de detalles rápidos */}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-black/[0.05] pt-3 sm:grid-cols-3 dark:border-white/[0.05]">
                {data.slice(0, 3).map((item) => (
                    <div
                        key={item.product_id}
                        className="rounded-xl bg-neutral-50/70 p-2 text-xs dark:bg-neutral-800/50"
                    >
                        <p className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                            {item.product_name}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span>{formatNumber(item.units_sold)} uds</span>
                            <span className="flex items-center gap-1">
                                <Package className="size-3" />
                                {item.units_in_stock} stock
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
