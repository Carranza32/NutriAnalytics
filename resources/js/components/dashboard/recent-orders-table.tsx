import { Clock, ShoppingCart } from 'lucide-react';
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import type { RecentOrderItem } from '@/types/dashboard';

interface RecentOrdersTableProps {
    orders: RecentOrderItem[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4.5 text-blue-500 dark:text-blue-400" />
                        <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Órdenes Recientes
                        </h2>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Últimos pedidos registrados en el período
                    </p>
                </div>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-black/[0.06] text-neutral-400 dark:border-white/[0.06]">
                            <th className="pb-3 font-medium">Pedido</th>
                            <th className="pb-3 font-medium">Cliente</th>
                            <th className="pb-3 font-medium">Fecha</th>
                            <th className="pb-3 font-medium">Destino</th>
                            <th className="pb-3 text-right font-medium">Items</th>
                            <th className="pb-3 text-right font-medium">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-6 text-center text-neutral-400">
                                    No hay órdenes registradas para este rango de fechas.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr
                                    key={order.order_id}
                                    className="group transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                                >
                                    <td className="py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                        #{order.order_id}
                                    </td>
                                    <td className="py-3 font-medium text-neutral-700 dark:text-neutral-300">
                                        {order.customer_id}
                                    </td>
                                    <td className="py-3 text-neutral-500 dark:text-neutral-400">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="size-3 text-neutral-400" />
                                            {order.order_date}
                                        </span>
                                    </td>
                                    <td className="py-3 text-neutral-600 dark:text-neutral-300">
                                        {order.ship_country}
                                    </td>
                                    <td className="py-3 text-right text-neutral-500 dark:text-neutral-400">
                                        {order.items_count} líneas
                                    </td>
                                    <td className="py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                                        {formatCurrency(order.total_amount, 2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
