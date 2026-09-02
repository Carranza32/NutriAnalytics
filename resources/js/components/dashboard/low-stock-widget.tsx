import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import type { LowStockItem } from '@/types/dashboard';

interface LowStockWidgetProps {
    alerts: LowStockItem[];
}

export function LowStockWidget({ alerts }: LowStockWidgetProps) {
    return (
        <div className="relative flex flex-col justify-between rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)]">
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="size-4.5 text-amber-500 dark:text-amber-400" />
                        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Alertas de Inventario
                        </h2>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        {alerts.length} en riesgo
                    </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    Artículos en o por debajo del umbral mínimo de seguridad
                </p>

                <div className="mt-4 space-y-3">
                    {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-neutral-400">
                            <CheckCircle2 className="size-8 text-emerald-500" />
                            <p className="mt-2 font-medium">Inventario en niveles óptimos</p>
                        </div>
                    ) : (
                        alerts.map((item) => {
                            const isOut = item.units_in_stock <= 0;
                            const percentage =
                                item.reorder_level > 0
                                    ? Math.min(
                                          Math.round(
                                              (item.units_in_stock / item.reorder_level) *
                                                  100
                                          ),
                                          100
                                      )
                                    : 0;

                            return (
                                <div
                                    key={item.product_id}
                                    className="rounded-xl border border-black/[0.04] bg-neutral-50/50 p-3 text-xs dark:border-white/[0.04] dark:bg-neutral-800/40"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                                                {item.product_name}
                                            </p>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                {item.category_name}
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                                                isOut
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            )}
                                        >
                                            <AlertTriangle className="size-2.5" />
                                            {isOut ? 'Agotado' : 'Reorden'}
                                        </span>
                                    </div>

                                    {/* Barra de progreso de stock vs reorder level */}
                                    <div className="mt-2.5 space-y-1">
                                        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                                            <span>
                                                Stock actual:{' '}
                                                <strong
                                                    className={
                                                        isOut
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-neutral-800 dark:text-neutral-200'
                                                    }
                                                >
                                                    {item.units_in_stock}
                                                </strong>
                                            </span>
                                            <span>Umbral: {item.reorder_level}</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all',
                                                    isOut
                                                        ? 'bg-rose-500'
                                                        : percentage < 50
                                                        ? 'bg-amber-500'
                                                        : 'bg-blue-500'
                                                )}
                                                style={{ width: `${Math.max(percentage, 5)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
