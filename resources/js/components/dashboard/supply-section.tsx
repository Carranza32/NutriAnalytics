import type { ColumnDef } from '@tanstack/react-table';
import {
    AlertOctagon,
    AlertTriangle,
    Boxes,
    CalendarClock,
    CheckCircle2,
    Clock,
    PackageCheck,
    Search,
    ShieldAlert,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { SupplyChainTrafficLight, SupplyItem } from '@/types/dashboard';

interface SupplySectionProps {
    data: SupplyChainTrafficLight;
}

export function SupplySection({ data }: SupplySectionProps) {
    const { kpis, predictive_alerts, items } = data;
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'critico' | 'alerta' | 'optimo' | 'exceso'>('all');

    // Filtrado por categoría de semáforo
    const filteredItems = useMemo(() => {
        if (selectedFilter === 'all') return items;
        return items.filter((item) => item.estado === selectedFilter);
    }, [items, selectedFilter]);

    // Columnas interactivas con ordenamiento TanStack
    const columns = useMemo<ColumnDef<SupplyItem>[]>(
        () => [
            {
                accessorKey: 'codprd',
                header: 'Código',
                cell: ({ row }) => (
                    <span className="font-mono text-[11px] text-neutral-500">
                        {row.original.codprd}
                    </span>
                ),
            },
            {
                accessorKey: 'producto',
                header: 'Producto / Insumo',
                cell: ({ row }) => (
                    <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                            {row.original.producto}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                            Presentación: {row.original.unibas}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'marca',
                header: 'Marca',
                cell: ({ row }) => (
                    <span className="font-medium text-neutral-600 dark:text-neutral-300">
                        {row.original.marca}
                    </span>
                ),
            },
            {
                accessorKey: 'stock_actual',
                header: 'Stock en Bodega',
                cell: ({ row }) => {
                    const isOut = row.original.stock_actual <= 0;
                    return (
                        <div className="text-right font-bold">
                            <span
                                className={
                                    isOut
                                        ? 'rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-600 dark:text-rose-400'
                                        : 'text-neutral-900 dark:text-neutral-100'
                                }
                            >
                                {formatNumber(row.original.stock_actual)}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'consumo_mensual',
                header: 'Salida Mensual',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.consumo_mensual)} /mes
                    </div>
                ),
            },
            {
                accessorKey: 'dias_cobertura',
                header: 'Días Cobertura',
                cell: ({ row }) => {
                    const item = row.original;
                    const isOut = item.stock_actual <= 0;
                    const isAlert = item.estado === 'alerta';
                    const isOptimo = item.estado === 'optimo';
                    const progressPct = Math.min(
                        Math.max(Math.round((item.dias_cobertura / 90) * 100), isOut ? 0 : 8),
                        100
                    );

                    return (
                        <div className="mx-auto w-24">
                            <div className="flex items-center justify-between text-[10px] font-semibold">
                                <span
                                    className={
                                        isOut
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : isAlert
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : isOptimo
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-sky-600 dark:text-sky-400'
                                    }
                                >
                                    {isOut ? 'Agotado (0d)' : `${item.dias_cobertura} días`}
                                </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        isOut
                                            ? 'bg-rose-500 w-full'
                                            : isAlert
                                            ? 'bg-amber-500'
                                            : isOptimo
                                            ? 'bg-emerald-500'
                                            : 'bg-sky-500'
                                    )}
                                    style={{
                                        width: isOut ? '100%' : `${progressPct}%`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'venta_6m',
                header: 'Venta 6 Meses',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(row.original.venta_6m)}
                    </div>
                ),
            },
            {
                accessorKey: 'sugerencia_compra',
                header: 'Sugerencia Reorden',
                cell: ({ row }) => (
                    <div className="text-right">
                        {row.original.sugerencia_compra > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                +{formatNumber(row.original.sugerencia_compra)} {row.original.unibas}
                            </span>
                        ) : (
                            <span className="text-neutral-400 text-xs">Cubierto</span>
                        )}
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <div className="space-y-6">
            {/* Header del Semáforo con Indicador de Campaña */}
            <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                Monitor Preventivo de Demanda
                            </span>
                        </div>
                        <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl dark:text-neutral-50">
                            Semáforo de Abastecimiento & Cobertura de Inventario
                        </h2>
                        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                            Proyección de días de existencia cruzando el ritmo de venta mensual con el stock físico en bodega.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start rounded-xl border border-black/[0.06] bg-neutral-50/80 px-3.5 py-2 text-xs shadow-2xs sm:self-auto dark:border-white/[0.08] dark:bg-neutral-800/80">
                        <CalendarClock className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <span className="block text-[10px] text-neutral-400 uppercase font-medium">Ciclo de Operación</span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                Temporada de Postrera & Mantenimiento
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de KPIs del Semáforo - Estilo Apple Limpio */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Quiebre Inmediato */}
                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Quiebre Inmediato (Stock ≤ 0)
                        </span>
                        <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                            <AlertOctagon className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(kpis.total_criticos)}
                        </span>
                        <span className="text-xs text-neutral-400">productos</span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Ventas en riesgo: </span>
                        <strong className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(kpis.venta_en_juego_critica)}</strong>
                    </div>
                </div>

                {/* Alerta de Reorden (< 30 días) */}
                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Riesgo Inminente (&lt; 30 Días)
                        </span>
                        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <Clock className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(kpis.total_alerta)}
                        </span>
                        <span className="text-xs text-neutral-400">artículos</span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Reorden antes de agotar: </span>
                        <strong className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(kpis.venta_en_juego_alerta)}</strong>
                    </div>
                </div>

                {/* Abastecimiento Óptimo (30 - 90 días) */}
                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Nivel Saludable (30-90 Días)
                        </span>
                        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <PackageCheck className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(kpis.total_optimo)}
                        </span>
                        <span className="text-xs text-neutral-400">en punto óptimo</span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cobertura balanceada de inventario</span>
                    </div>
                </div>

                {/* Sobre-Stock (> 90 días) */}
                <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Sobre-Stock (&gt; 90 Días)
                        </span>
                        <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
                            <Boxes className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(kpis.total_exceso)}
                        </span>
                        <span className="text-xs text-neutral-400">artículos</span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="text-sky-600 dark:text-sky-400 font-medium">Capital inmovilizado en bodega</span>
                    </div>
                </div>
            </div>

            {/* Bloque Destacado: Alertas Preventivas Predictivas (Apple Card Style) */}
            <div className="relative rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4.5 text-amber-500" />
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Alertas Predictivas de Suministro
                    </h3>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Notificaciones generadas automáticamente cruzando el ritmo de demanda con existencias en bodega
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {predictive_alerts.map((alert, idx) => {
                        const isUrgente = alert.nivel === 'urgente';
                        return (
                            <div
                                key={idx}
                                className={cn(
                                    'flex flex-col justify-between rounded-xl border p-4 text-xs transition-all',
                                    isUrgente
                                        ? 'border-rose-500/20 bg-rose-500/[0.04] dark:border-rose-500/30 dark:bg-rose-500/[0.08]'
                                        : 'border-amber-500/20 bg-amber-500/[0.04] dark:border-amber-500/30 dark:bg-amber-500/[0.08]'
                                )}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                            {alert.producto}
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                                                isUrgente
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            )}
                                        >
                                            {isUrgente ? (
                                                <AlertOctagon className="size-2.5" />
                                            ) : (
                                                <AlertTriangle className="size-2.5" />
                                            )}
                                            {isUrgente ? 'Quiebre' : `${alert.dias_restantes}d Cobertura`}
                                        </span>
                                    </div>

                                    <div className="mt-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                        Línea: {alert.marca}
                                    </div>

                                    <p className="mt-2 text-neutral-700 leading-relaxed dark:text-neutral-300">
                                        {alert.mensaje}
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-black/[0.05] pt-2.5 dark:border-white/[0.05]">
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                        Acción Recomendada:
                                    </span>
                                    <span
                                        className={cn(
                                            'font-medium',
                                            isUrgente
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : 'text-amber-600 dark:text-amber-400'
                                        )}
                                    >
                                        {alert.sugerencia}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tabla Completa de Abastecimiento & Cobertura */}
            <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                {/* Barra de Filtros y Buscador */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    {/* Filtros por Semáforo */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/[0.06] bg-neutral-100/80 p-1 dark:border-white/[0.08] dark:bg-neutral-800/80">
                        <button
                            type="button"
                            onClick={() => setSelectedFilter('all')}
                            className={cn(
                                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                selectedFilter === 'all'
                                    ? 'bg-white font-semibold text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-neutral-50'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            Todos ({items.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedFilter('critico')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                selectedFilter === 'critico'
                                    ? 'bg-white font-semibold text-rose-600 shadow-xs dark:bg-neutral-700 dark:text-rose-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            <span>Quiebre ({kpis.total_criticos})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedFilter('alerta')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                selectedFilter === 'alerta'
                                    ? 'bg-white font-semibold text-amber-600 shadow-xs dark:bg-neutral-700 dark:text-amber-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            <span>Riesgo &lt;30d ({kpis.total_alerta})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedFilter('optimo')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                selectedFilter === 'optimo'
                                    ? 'bg-white font-semibold text-emerald-600 shadow-xs dark:bg-neutral-700 dark:text-emerald-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>Óptimo ({kpis.total_optimo})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedFilter('exceso')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                selectedFilter === 'exceso'
                                    ? 'bg-white font-semibold text-sky-600 shadow-xs dark:bg-neutral-700 dark:text-sky-400'
                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-sky-500" />
                            <span>Sobre-Stock ({kpis.total_exceso})</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de Cobertura con Ordenamiento y Paginación TanStack */}
                <div className="mt-4">
                    <DataTable
                        columns={columns}
                        data={filteredItems}
                        searchPlaceholder="Buscar por código, producto o marca..."
                        initialPageSize={15}
                    />
                </div>
            </div>
        </div>
    );
}
