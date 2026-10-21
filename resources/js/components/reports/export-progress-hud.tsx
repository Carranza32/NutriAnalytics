import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    Loader2,
    X,
} from 'lucide-react';
import React from 'react';

export interface ExportState {
    isExporting: boolean;
    format: 'excel' | 'pdf' | null;
    progress: number;
    statusText: string;
    isCompleted: boolean;
    error: string | null;
    filename: string | null;
}

interface ExportProgressHUDProps {
    state: ExportState;
    onCancel: () => void;
    onDismiss: () => void;
}

export function ExportProgressHUD({
    state,
    onCancel,
    onDismiss,
}: ExportProgressHUDProps) {
    const isVisible = state.isExporting || state.isCompleted || !!state.error;

    if (!isVisible) return null;

    const isExcel = state.format === 'excel';
    const isPdf = state.format === 'pdf';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.94 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 p-4.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-neutral-900/95 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]"
                role="status"
                aria-live="polite"
            >
                {/* Header: Icono + Título + Botón de Acción */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                state.error
                                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                                    : state.isCompleted
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : isExcel
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300'
                                    : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300'
                            }`}
                        >
                            {state.error ? (
                                <AlertCircle className="size-5" />
                            ) : state.isCompleted ? (
                                <CheckCircle2 className="size-5 animate-in zoom-in-75 duration-300" />
                            ) : state.isExporting ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : isExcel ? (
                                <FileSpreadsheet className="size-5" />
                            ) : (
                                <FileText className="size-5" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    {state.error
                                        ? 'Error de exportación'
                                        : state.isCompleted
                                        ? '¡Reporte descargado!'
                                        : isExcel
                                        ? 'Generando Libro Excel'
                                        : 'Compilando PDF Directorio'}
                                </h4>

                                {!state.error && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums transition-colors ${
                                            state.isCompleted
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                                        }`}
                                    >
                                        {state.progress}%
                                    </span>
                                )}
                            </div>

                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                {state.error || state.statusText || 'Procesando solicitud...'}
                            </p>
                        </div>
                    </div>

                    {/* Botón cerrar / cancelar */}
                    <button
                        onClick={state.isExporting ? onCancel : onDismiss}
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title={state.isExporting ? 'Cancelar exportación' : 'Cerrar notificación'}
                        aria-label={state.isExporting ? 'Cancelar exportación' : 'Cerrar notificación'}
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Barra de Progreso Fluida estilo Apple */}
                {!state.error && (
                    <div className="mt-3.5 space-y-1.5">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <motion.div
                                className={`h-full rounded-full transition-all duration-300 ease-out ${
                                    state.isCompleted
                                        ? 'bg-emerald-500'
                                        : isExcel
                                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-400'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${state.progress}%` }}
                                transition={{ ease: 'easeOut', duration: 0.3 }}
                            />
                        </div>

                        {state.filename && (
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate text-right">
                                {state.filename}
                            </p>
                        )}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
