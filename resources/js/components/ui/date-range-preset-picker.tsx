import { Calendar as CalendarIcon, Check, ChevronDown, Clock } from 'lucide-react';
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangePreset {
    label: string;
    from: string;
    to: string;
}

interface DateRangePresetPickerProps {
    dateFrom: string;
    dateTo: string;
    onChange: (from: string, to: string) => void;
    className?: string;
}

export function DateRangePresetPicker({
    dateFrom,
    dateTo,
    onChange,
    className,
}: DateRangePresetPickerProps) {
    const [open, setOpen] = useState(false);
    const [tempFrom, setTempFrom] = useState(dateFrom);
    const [tempTo, setTempTo] = useState(dateTo);

    const presets: DateRangePreset[] = [
        { label: 'Ejercicio 2026 Completo', from: '2026-01-01', to: '2026-12-31' },
        { label: 'Mes Actual (Octubre 2026)', from: '2026-10-01', to: '2026-10-31' },
        { label: 'Mes Anterior (Septiembre 2026)', from: '2026-09-01', to: '2026-09-30' },
        { label: 'Pico de Siembra (Mayo 2026)', from: '2026-05-01', to: '2026-05-31' },
        { label: 'Tercer Trimestre (Q3 2026)', from: '2026-07-01', to: '2026-09-30' },
        { label: 'Año Anterior (2025)', from: '2025-01-01', to: '2025-12-31' },
    ];

    const activePreset = presets.find((p) => p.from === dateFrom && p.to === dateTo);

    const handleSelectPreset = (preset: DateRangePreset) => {
        setTempFrom(preset.from);
        setTempTo(preset.to);
        onChange(preset.from, preset.to);
        setOpen(false);
    };

    const handleApplyManual = () => {
        onChange(tempFrom, tempTo);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex w-full items-center justify-between rounded-xl border border-black/[0.08] bg-neutral-50/60 py-1.5 pl-3 pr-2.5 text-xs text-neutral-900 transition outline-none hover:bg-neutral-100/70 focus:border-emerald-500 focus:bg-white dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700/60 dark:focus:bg-neutral-800',
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        <CalendarIcon className="size-3.5 text-neutral-400 shrink-0" />
                        <span className="font-medium truncate">
                            {activePreset ? activePreset.label : `${dateFrom} al ${dateTo}`}
                        </span>
                    </div>
                    <ChevronDown className="size-3 text-neutral-400 shrink-0 ml-1.5" />
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-[340px] p-4" align="start">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    <Clock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Atajos Rápidos de Período</span>
                </div>

                {/* Presets List */}
                <div className="space-y-1 mb-4">
                    {presets.map((preset) => {
                        const isSelected = dateFrom === preset.from && dateTo === preset.to;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleSelectPreset(preset)}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                                    isSelected
                                        ? 'bg-emerald-500/10 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                )}
                            >
                                <span>{preset.label}</span>
                                {isSelected && <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
                    <span className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                        O selecciona un rango personalizado:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-[10px] text-neutral-400 uppercase">Desde</span>
                            <input
                                type="date"
                                value={tempFrom}
                                onChange={(e) => setTempFrom(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 py-1 text-xs outline-none focus:border-emerald-500 focus:bg-white dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-100"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-neutral-400 uppercase">Hasta</span>
                            <input
                                type="date"
                                value={tempTo}
                                onChange={(e) => setTempTo(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 py-1 text-xs outline-none focus:border-emerald-500 focus:bg-white dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-100"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleApplyManual}
                        className="mt-3 w-full rounded-xl bg-neutral-900 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                    >
                        Aplicar Rango Personalizado
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
