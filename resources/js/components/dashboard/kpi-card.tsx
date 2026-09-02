import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    badge?: {
        text: string;
        variant?: 'emerald' | 'amber' | 'sky' | 'indigo' | 'rose';
    };
    iconColor?: string;
    delay?: number;
}

const badgeStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    badge,
    iconColor = 'text-blue-500 dark:text-blue-400',
    delay = 0,
}: KpiCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: 'spring',
                bounce: 0,
                duration: 0.4,
                delay,
            }}
            whileHover={{
                y: -2,
                transition: { type: 'spring', bounce: 0, duration: 0.25 },
            }}
            className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-shadow hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] dark:border-white/[0.08] dark:bg-neutral-900/80 dark:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                    {title}
                </span>
                <div
                    className={cn(
                        'flex size-9 items-center justify-center rounded-xl bg-neutral-100/80 backdrop-blur-md transition-colors group-hover:scale-105 dark:bg-neutral-800/80',
                        iconColor
                    )}
                >
                    <Icon className="size-4.5" />
                </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 lg:text-3xl">
                    {value}
                </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                {subtitle && (
                    <span className="text-neutral-500 dark:text-neutral-400">
                        {subtitle}
                    </span>
                )}
                {badge && (
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
                            badgeStyles[badge.variant ?? 'emerald']
                        )}
                    >
                        {badge.text}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
