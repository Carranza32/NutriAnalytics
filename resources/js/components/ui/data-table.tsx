import {
    flexRender,
    useReactTable,
} from '@tanstack/react-table';
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
} from '@tanstack/table-core';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    globalFilterColumn?: string;
    initialPageSize?: number;
    className?: string;
    showColumnVisibility?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder = 'Buscar en los resultados...',
    globalFilterColumn,
    initialPageSize = 25,
    className,
    showColumnVisibility = true,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: initialPageSize,
            },
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className={cn('space-y-3', className)}>
            {/* Barra de Controles: Búsqueda rápida en vivo + Visibilidad de columnas */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[240px] flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full rounded-xl border border-black/[0.08] bg-neutral-50/60 py-1.5 pl-8 pr-3 text-xs text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:bg-white dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-800"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Selector de Tamaño de Página */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Mostrar:</span>
                        <select
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => table.setPageSize(Number(e.target.value))}
                            className="rounded-lg border border-black/[0.08] bg-white py-1 px-2 text-xs font-medium outline-none dark:border-white/[0.08] dark:bg-neutral-800"
                        >
                            {[10, 25, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size} filas
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Popover de Visibilidad de Columnas */}
                    {showColumnVisibility && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white py-1.5 px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 shadow-xs dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                >
                                    <SlidersHorizontal className="size-3 text-neutral-400" />
                                    <span>Columnas</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="end">
                                <span className="block px-2 py-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                                    Mostrar / Ocultar
                                </span>
                                <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                                    {table
                                        .getAllColumns()
                                        .filter((col) => col.getCanHide())
                                        .map((col) => (
                                            <label
                                                key={col.id}
                                                className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100 cursor-pointer dark:text-neutral-300 dark:hover:bg-neutral-800"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={col.getIsVisible()}
                                                    onChange={(e) => col.toggleVisibility(e.target.checked)}
                                                    className="size-3.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="capitalize">
                                                    {typeof col.columnDef.header === 'string'
                                                        ? col.columnDef.header
                                                        : col.id}
                                                </span>
                                            </label>
                                        ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            {/* Tabla Renderizada con Sorting */}
            <div className="overflow-x-auto rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
                <table className="w-full text-left text-xs">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                className="border-b border-black/[0.06] bg-neutral-50/80 text-neutral-500 dark:border-white/[0.06] dark:bg-neutral-800/60 dark:text-neutral-400"
                            >
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const isSorted = header.column.getIsSorted();

                                    return (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                'py-2.5 px-3 font-semibold select-none',
                                                canSort && 'cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors'
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
                                                      )}
                                                {canSort && (
                                                    <span className="text-neutral-400">
                                                        {isSorted === 'asc' ? (
                                                            <ArrowUp className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                        ) : isSorted === 'desc' ? (
                                                            <ArrowDown className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] bg-white dark:divide-white/[0.04] dark:bg-neutral-900/50">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-8 text-center text-neutral-400">
                                    No se encontraron registros con los criterios actuales.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="py-2.5 px-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex flex-col items-center justify-between gap-3 py-2 text-xs text-neutral-500 sm:flex-row dark:text-neutral-400">
                <div>
                    Mostrando{' '}
                    <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                    </strong>{' '}
                    a{' '}
                    <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}
                    </strong>{' '}
                    de{' '}
                    <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {table.getFilteredRowModel().rows.length}
                    </strong>{' '}
                    registros
                </div>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        className="rounded-lg border border-black/[0.08] p-1.5 transition hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/[0.08] dark:hover:bg-neutral-800"
                        title="Primera página"
                    >
                        <ChevronsLeft className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="rounded-lg border border-black/[0.08] p-1.5 transition hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/[0.08] dark:hover:bg-neutral-800"
                        title="Página anterior"
                    >
                        <ChevronLeft className="size-3.5" />
                    </button>

                    <span className="px-2 font-medium">
                        Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
                    </span>

                    <button
                        type="button"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="rounded-lg border border-black/[0.08] p-1.5 transition hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/[0.08] dark:hover:bg-neutral-800"
                        title="Página siguiente"
                    >
                        <ChevronRight className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        className="rounded-lg border border-black/[0.08] p-1.5 transition hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/[0.08] dark:hover:bg-neutral-800"
                        title="Última página"
                    >
                        <ChevronsRight className="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
