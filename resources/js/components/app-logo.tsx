import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-neutral-900">
                <AppLogoIcon className="size-4.5" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-neutral-900 dark:text-white font-sans">
                Nutri<span className="text-emerald-600 dark:text-emerald-400">Analytics</span>
            </span>
        </div>
    );
}
