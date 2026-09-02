import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatCurrency(amount: number, minimumFractionDigits = 0): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits,
        maximumFractionDigits: minimumFractionDigits === 0 ? 0 : 2,
    }).format(amount);
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}
