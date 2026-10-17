import { Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { motion } from 'framer-motion';
import React from 'react';
import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import reports from '@/routes/reports';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

interface HeaderNavItem {
    title: string;
    shortTitle: string;
    href: NonNullable<InertiaLinkProps['href']>;
}

const mainNavItems: HeaderNavItem[] = [
    {
        title: 'Dashboard Ejecutivo',
        shortTitle: 'Dashboard',
        href: dashboard(),
    },
    {
        title: 'Centro de Reportería',
        shortTitle: 'Reportería',
        href: reports.index(),
    },
];

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
            <div className="flex h-16 w-full items-center justify-between px-3 sm:px-6 lg:px-8">
                {/* Izquierda: Logotipo */}
                <div className="flex items-center shrink-0">
                    <Link href={dashboard()} prefetch className="flex items-center">
                        <AppLogo />
                    </Link>
                </div>

                {/* Centro: Menú Simple y Directo (visible tanto en móvil como en escritorio) */}
                <nav className="flex items-center gap-4 sm:gap-8">
                    {mainNavItems.map((item) => {
                        const active = isCurrentUrl(item.href);
                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'relative py-1 text-xs sm:text-sm whitespace-nowrap transition-colors',
                                    active
                                        ? 'font-bold text-neutral-900 dark:text-white'
                                        : 'font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                )}
                            >
                                <span className="sm:hidden">{item.shortTitle}</span>
                                <span className="hidden sm:inline">{item.title}</span>
                                {active && (
                                    <motion.div
                                        layoutId="activeNavLine"
                                        className="absolute -bottom-1 sm:-bottom-1.5 left-0 right-0 h-[2.5px] rounded-full bg-emerald-600 dark:bg-emerald-400"
                                        transition={{
                                            type: 'spring',
                                            bounce: 0,
                                            duration: 0.3,
                                        }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Derecha: Menú de Usuario / Perfil si existe */}
                <div className="flex items-center justify-end shrink-0">
                    {auth?.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-8 sm:size-9 rounded-full p-0.5 hover:ring-2 hover:ring-neutral-200 dark:hover:ring-neutral-700"
                                >
                                    <Avatar className="size-7 sm:size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user?.avatar}
                                            alt={auth.user?.name}
                                        />
                                        <AvatarFallback className="rounded-full bg-neutral-200 text-xs font-semibold text-neutral-800 dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Breadcrumbs solo si hay más de 1 */}
            {breadcrumbs.length > 1 && (
                <div className="border-t border-black/[0.04] bg-neutral-50/50 px-4 py-2 sm:px-6 lg:px-8 dark:border-white/[0.04] dark:bg-neutral-900/50">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}
        </header>
    );
}
