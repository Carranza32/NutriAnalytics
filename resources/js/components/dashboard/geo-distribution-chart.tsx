import type { ApexOptions } from 'apexcharts';
import { Globe2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { CountrySalesItem } from '@/types/dashboard';

interface GeoDistributionChartProps {
    data: CountrySalesItem[];
}

export function GeoDistributionChart({ data }: GeoDistributionChartProps) {
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

    const categories = data.map((d) => d.country);
    const series = [
        {
            name: 'Facturación ($)',
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
                borderRadius: 6,
                columnWidth: '45%',
                distributed: false,
            },
        },
        colors: ['#6366f1'], // Indigo
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
                formatter: (val) => formatCurrency(val),
            },
        },
    };

    return (
        <div className="relative rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Globe2 className="size-4.5 text-indigo-500 dark:text-indigo-400" />
                        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Mercados Internacionales
                        </h2>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Ingresos por país de destino principal
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

            {/* Listado de pedidos por país */}
            <div className="mt-2 flex flex-wrap gap-2 border-t border-black/[0.05] pt-3 dark:border-white/[0.05]">
                {data.map((item) => (
                    <span
                        key={item.country}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100/70 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-300"
                    >
                        <span className="font-semibold">{item.country}:</span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                            {formatNumber(item.orders_count)} órdenes
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}
