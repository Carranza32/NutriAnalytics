import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Building2,
    Calendar,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    RotateCcw,
    Sparkles,
    Tag,
    Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { DateRangePresetPicker } from '@/components/ui/date-range-preset-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';
import reports from '@/routes/reports';
import type {
    BranchRecord,
    BrandRecord,
    DetailedSaleRecord,
    ReportPageProps,
    SellerRecord,
} from '@/types/reports';

export default function ReportsIndex({
    filters,
    filter_options,
    kpis,
    records,
    total_count,
}: ReportPageProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '2026-01-01');
    const [dateTo, setDateTo] = useState(filters.date_to || '2026-12-31');
    const [vendedor, setVendedor] = useState(filters.vendedor || '');
    const [marca, setMarca] = useState(filters.marca || '');
    const [sucursal, setSucursal] = useState(filters.sucursal || '');
    const [tipo, setTipo] = useState(filters.tipo || 'ventas_detalle');

    const handleApplyFilters = (newTipo?: string) => {
        const activeTipo = newTipo || tipo;
        router.get(
            reports.index(),
            {
                date_from: dateFrom,
                date_to: dateTo,
                vendedor: vendedor || undefined,
                marca: marca || undefined,
                sucursal: sucursal || undefined,
                tipo: activeTipo,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleResetFilters = () => {
        setDateFrom('2026-01-01');
        setDateTo('2026-12-31');
        setVendedor('');
        setMarca('');
        setSucursal('');
        setTipo('ventas_detalle');

        router.get(reports.index(), {
            date_from: '2026-01-01',
            date_to: '2026-12-31',
            tipo: 'ventas_detalle',
        });
    };

    // URLs de exportación directa
    const exportExcelUrl = reports.export.excel.url({
        query: {
            date_from: dateFrom,
            date_to: dateTo,
            vendedor: vendedor || undefined,
            marca: marca || undefined,
            sucursal: sucursal || undefined,
            tipo: tipo,
        },
    });

    const exportPdfUrl = reports.export.pdf.url({
        query: {
            date_from: dateFrom,
            date_to: dateTo,
            vendedor: vendedor || undefined,
            marca: marca || undefined,
            sucursal: sucursal || undefined,
            tipo: tipo,
        },
    });

    // Columnas TanStack para Detalle de Ventas
    const detailedColumns = useMemo<ColumnDef<DetailedSaleRecord>[]>(
        () => [
            {
                accessorKey: 'numfct',
                header: 'Factura',
                cell: ({ row }) => (
                    <span className="font-mono text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">
                        #{row.original.numfct}
                    </span>
                ),
            },
            {
                accessorKey: 'fecfct',
                header: 'Fecha',
                cell: ({ row }) => (
                    <span className="text-neutral-500 whitespace-nowrap text-[11px]">
                        {row.original.fecfct}
                    </span>
                ),
            },
            {
                accessorKey: 'cliente',
                header: 'Cliente',
                cell: ({ row }) => (
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 line-clamp-1">
                        {row.original.cliente}
                    </span>
                ),
            },
            {
                accessorKey: 'vendedor',
                header: 'Vendedor',
                cell: ({ row }) => (
                    <span className="text-neutral-600 dark:text-neutral-300">
                        {row.original.vendedor}
                    </span>
                ),
            },
            {
                accessorKey: 'producto',
                header: 'Producto / Insumo',
                cell: ({ row }) => (
                    <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                            {row.original.producto}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                            {row.original.marca} • {row.original.codprd}
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'cantidad',
                header: 'Cantidad',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.cantidad)}
                    </div>
                ),
            },
            {
                accessorKey: 'precio',
                header: 'Precio Unit.',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(row.original.precio)}
                    </div>
                ),
            },
            {
                accessorKey: 'subtotal',
                header: 'Subtotal ($)',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-neutral-900 dark:text-neutral-50">
                        {formatCurrency(row.original.subtotal)}
                    </div>
                ),
            },
        ],
        []
    );

    // Columnas TanStack para Resumen por Vendedor
    const sellerColumns = useMemo<ColumnDef<SellerRecord>[]>(
        () => [
            {
                accessorKey: 'vendedor',
                header: 'Asesor Comercial',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.original.vendedor}
                    </span>
                ),
            },
            {
                accessorKey: 'total_facturas',
                header: 'Facturas Emitidas',
                cell: ({ row }) => (
                    <div className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.total_facturas)}
                    </div>
                ),
            },
            {
                accessorKey: 'total_clientes',
                header: 'Clientes Atendidos',
                cell: ({ row }) => (
                    <div className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.total_clientes)}
                    </div>
                ),
            },
            {
                accessorKey: 'unidades',
                header: 'Unidades Vendidas',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.unidades)}
                    </div>
                ),
            },
            {
                accessorKey: 'total_facturado',
                header: 'Total Facturado ($)',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.original.total_facturado)}
                    </div>
                ),
            },
            {
                accessorKey: 'ticket_promedio',
                header: 'Ticket Promedio ($)',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(row.original.ticket_promedio)}
                    </div>
                ),
            },
        ],
        []
    );

    // Columnas TanStack para Resumen por Marca
    const brandColumns = useMemo<ColumnDef<BrandRecord>[]>(
        () => [
            {
                accessorKey: 'marca',
                header: 'Marca / Línea',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.original.marca}
                    </span>
                ),
            },
            {
                accessorKey: 'productos_vendidos',
                header: 'Artículos Activos',
                cell: ({ row }) => (
                    <div className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.productos_vendidos)}
                    </div>
                ),
            },
            {
                accessorKey: 'unidades',
                header: 'Unidades Vendidas',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.unidades)}
                    </div>
                ),
            },
            {
                accessorKey: 'total_facturado',
                header: 'Total Facturado ($)',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.original.total_facturado)}
                    </div>
                ),
            },
        ],
        []
    );

    // Columnas TanStack para Resumen por Sucursal
    const branchColumns = useMemo<ColumnDef<BranchRecord>[]>(
        () => [
            {
                accessorKey: 'sucursal',
                header: 'Sucursal / Punto de Venta',
                cell: ({ row }) => (
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {row.original.sucursal}
                    </span>
                ),
            },
            {
                accessorKey: 'total_facturas',
                header: 'Facturas Emitidas',
                cell: ({ row }) => (
                    <div className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.total_facturas)}
                    </div>
                ),
            },
            {
                accessorKey: 'unidades',
                header: 'Unidades Despachadas',
                cell: ({ row }) => (
                    <div className="text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {formatNumber(row.original.unidades)}
                    </div>
                ),
            },
            {
                accessorKey: 'total_facturado',
                header: 'Total Facturado ($)',
                cell: ({ row }) => (
                    <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.original.total_facturado)}
                    </div>
                ),
            },
        ],
        []
    );

    return (
        <>
            <Head title="Centro de Reportería Inteligente" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header Superior estilo Apple */}
                <header className="flex flex-col justify-between gap-4 border-b border-black/[0.06] pb-5 lg:flex-row lg:items-center dark:border-white/[0.06]">
                    <div>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
                            Centro de Reportería Inteligente
                        </h1>
                        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                            Filtros predictivos con buscador instantáneo, ordenamiento por columnas y exportación a Excel nativo sin tablas desfasadas.
                        </p>
                    </div>

                    {/* Botones de Exportación Directa */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href={exportExcelUrl}
                            download
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white shadow-xs dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
                        >
                            <FileSpreadsheet className="size-4" />
                            <span>Exportar Excel (.xlsx)</span>
                        </a>

                        <a
                            href={exportPdfUrl}
                            download
                            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 shadow-xs dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        >
                            <FileText className="size-4 text-rose-500" />
                            <span>PDF Directorio (1 Pág)</span>
                        </a>
                    </div>
                </header>

                {/* Barra de Filtros Dinámicos con Buscadores Inteligentes */}
                <section className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="flex flex-col justify-between gap-3 border-b border-black/[0.05] pb-3 sm:flex-row sm:items-center dark:border-white/[0.05]">
                        <div className="flex items-center gap-2">
                            <Filter className="size-4 text-neutral-500" />
                            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                Criterios de Selección & Filtros
                            </h2>
                        </div>

                        {/* Modos de Agrupación (Pills) */}
                        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-black/[0.06] bg-neutral-100/80 p-1 dark:border-white/[0.08] dark:bg-neutral-800/80">
                            {filter_options.tipos.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        setTipo(t.id as any);
                                        handleApplyFilters(t.id);
                                    }}
                                    className={cn(
                                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                        tipo === t.id
                                            ? 'bg-white font-semibold text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-neutral-50'
                                            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                                    )}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inputs con Buscador Integrado (Combobox) y Date Presets */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {/* 1. Selector de Rango de Fechas con Atajos */}
                        <div>
                            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                Período / Fechas
                            </label>
                            <DateRangePresetPicker
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                onChange={(f, t) => {
                                    setDateFrom(f);
                                    setDateTo(t);
                                }}
                            />
                        </div>

                        {/* 2. Asesor Comercial (Searchable Combobox) */}
                        <div>
                            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                Vendedor / Asesor
                            </label>
                            <SearchableSelect
                                options={filter_options.vendedores}
                                value={vendedor}
                                onChange={setVendedor}
                                placeholder="Todos los Vendedores"
                                allLabel="Todos los Vendedores"
                                icon={Users}
                            />
                        </div>

                        {/* 3. Marca / Rubro (Searchable Combobox) */}
                        <div>
                            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                Marca / Rubro
                            </label>
                            <SearchableSelect
                                options={filter_options.marcas}
                                value={marca}
                                onChange={setMarca}
                                placeholder="Todas las Marcas"
                                allLabel="Todas las Marcas"
                                icon={Tag}
                            />
                        </div>

                        {/* 4. Sucursal (Searchable Combobox) */}
                        <div>
                            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                Sucursal
                            </label>
                            <SearchableSelect
                                options={filter_options.sucursales}
                                value={sucursal}
                                onChange={setSucursal}
                                placeholder="Todas las Sucursales"
                                allLabel="Todas las Sucursales"
                                icon={Building2}
                            />
                        </div>

                        {/* 5. Botones de Acción */}
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={() => handleApplyFilters()}
                                className="flex-1 rounded-xl bg-neutral-900 py-1.5 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-xs dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                            >
                                Aplicar Filtros
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                title="Restablecer Filtros"
                                className="rounded-xl border border-black/[0.08] bg-neutral-100 p-2 text-neutral-600 transition hover:bg-neutral-200 dark:border-white/[0.08] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                            >
                                <RotateCcw className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Resumen Superior de Métricas Rápidas */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Facturación Filtrada
                        </span>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatCurrency(kpis.total_revenue)}
                        </div>
                        <span className="mt-1 block text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatNumber(kpis.total_invoices)} facturas válidas
                        </span>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Volumen Despachado
                        </span>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(kpis.total_units)} uds
                        </div>
                        <span className="mt-1 block text-xs text-neutral-500">
                            En el rango seleccionado
                        </span>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Clientes Atendidos
                        </span>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatNumber(kpis.total_clients)}
                        </div>
                        <span className="mt-1 block text-xs text-neutral-500">
                            Cuentas con compras activas
                        </span>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Ticket Promedio
                        </span>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {formatCurrency(kpis.average_ticket)}
                        </div>
                        <span className="mt-1 block text-xs text-neutral-500">
                            Por comprobante fiscal
                        </span>
                    </div>
                </section>

                {/* Tabla Interactiva TanStack con Sorting y Paginación */}
                <section className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-neutral-900/80">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Explorador de Datos Interactivo
                        </h3>
                        <p className="text-xs text-neutral-500">
                            Haz clic en los encabezados para ordenar ascendentemente o descendentemente. Usa el buscador para filtrar en vivo.
                        </p>
                    </div>

                    {tipo === 'ventas_detalle' && (
                        <DataTable
                            columns={detailedColumns}
                            data={records as DetailedSaleRecord[]}
                            searchPlaceholder="Buscar por cliente, factura o producto..."
                            initialPageSize={25}
                        />
                    )}

                    {tipo === 'por_vendedor' && (
                        <DataTable
                            columns={sellerColumns}
                            data={records as SellerRecord[]}
                            searchPlaceholder="Buscar asesor comercial..."
                            initialPageSize={25}
                        />
                    )}

                    {tipo === 'por_marca' && (
                        <DataTable
                            columns={brandColumns}
                            data={records as BrandRecord[]}
                            searchPlaceholder="Buscar marca o insumo..."
                            initialPageSize={25}
                        />
                    )}

                    {tipo === 'por_sucursal' && (
                        <DataTable
                            columns={branchColumns}
                            data={records as BranchRecord[]}
                            searchPlaceholder="Buscar sucursal..."
                            initialPageSize={25}
                        />
                    )}
                </section>
            </div>
        </>
    );
}

