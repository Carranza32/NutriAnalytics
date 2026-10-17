import { Check, ChevronDown, LucideIcon, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SearchableOption {
    id: string;
    name: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    allLabel?: string;
    icon?: LucideIcon;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    allLabel = 'Todos',
    icon: Icon,
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedOption = useMemo(
        () => options.find((opt) => opt.id === value),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter((opt) => opt.name.toLowerCase().includes(q) || opt.id.toLowerCase().includes(q));
    }, [options, search]);

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setOpen(false);
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'flex w-full items-center justify-between rounded-xl border border-black/[0.08] bg-neutral-50/60 py-1.5 pl-3 pr-2.5 text-xs text-neutral-900 transition outline-none hover:bg-neutral-100/70 focus:border-emerald-500 focus:bg-white dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700/60 dark:focus:bg-neutral-800',
                        disabled && 'opacity-50 cursor-not-allowed',
                        className
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        {Icon && <Icon className="size-3.5 text-neutral-400 shrink-0" />}
                        <span className={cn('truncate', !selectedOption && 'text-neutral-500 dark:text-neutral-400')}>
                            {selectedOption ? selectedOption.name : allLabel || placeholder}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 ml-1.5 shrink-0">
                        {value && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={handleClear}
                                className="rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                            >
                                <X className="size-3" />
                            </span>
                        )}
                        <ChevronDown className="size-3 text-neutral-400" />
                    </div>
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-[280px] p-2" align="start">
                <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Buscar entre ${options.length} opciones...`}
                        className="w-full rounded-lg border border-black/[0.08] bg-neutral-50 py-1 pl-8 pr-2.5 text-xs text-neutral-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-100"
                    />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                    {allLabel && !search && (
                        <button
                            type="button"
                            onClick={() => handleSelect('')}
                            className={cn(
                                'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                                !value
                                    ? 'bg-emerald-500/10 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                            )}
                        >
                            <span>{allLabel}</span>
                            {!value && <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </button>
                    )}

                    {filteredOptions.length === 0 ? (
                        <div className="py-4 text-center text-xs text-neutral-400">
                            No se encontraron resultados
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = value === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelect(opt.id)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors',
                                        isSelected
                                            ? 'bg-emerald-500/10 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                    )}
                                >
                                    <span className="truncate">{opt.name}</span>
                                    {isSelected && (
                                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
