import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, Smartphone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
    const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verificar si ya se ejecuta como PWA instalada
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            return;
        }

        // Verificar si el usuario lo cerró en los últimos 7 días
        const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
        if (dismissedAt) {
            const daysSinceDismiss =
                (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismiss < 7) {
                return;
            }
        }

        // Detección de iOS (Safari)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice =
            /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // Mostrar después de 3 segundos para no interrumpir la carga inicial
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }

        // Detección para Android / Chrome (beforeinstallprompt)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            setTimeout(() => setIsVisible(true), 2500);
        };

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt
        );

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPromptEvent) return;

        installPromptEvent.prompt();
        const { outcome } = await installPromptEvent.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
            setInstallPromptEvent(null);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 p-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-neutral-900/95 sm:bottom-6 sm:left-auto sm:right-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400">
                            <Smartphone className="size-6" />
                        </div>

                        <div>
                            <h4 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                                Instalar NutriAnalytics
                            </h4>
                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                {isIOS
                                    ? 'Accede al portal a pantalla completa como una App en tu iPhone.'
                                    : 'Agrégalo a tu pantalla de inicio para acceso rápido y offline.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        aria-label="Cerrar aviso"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-black/[0.05] pt-3 dark:border-white/[0.05]">
                    {isIOS ? (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <span>Toca</span>
                            <span className="inline-flex items-center rounded-md border border-black/[0.08] bg-neutral-100 px-1.5 py-0.5 text-neutral-800 dark:border-white/[0.1] dark:bg-neutral-800 dark:text-neutral-200">
                                <Share className="mr-1 size-3 text-sky-500" />
                                Compartir
                            </span>
                            <span>y luego <strong>"Agregar al inicio"</strong></span>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-1.5 text-xs font-semibold text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                            >
                                Ahora no
                            </button>

                            <button
                                onClick={handleInstallClick}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98]"
                            >
                                <Download className="size-3.5" />
                                <span>Instalar Aplicación</span>
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
