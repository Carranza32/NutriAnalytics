import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Building2,
    Calendar,
    Check,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Loader2,
    RotateCcw,
    Sparkles,
    Tag,
    Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExportProgressHUD, type ExportState } from '@/components/reports/export-progress-hud';
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

    // Estado del indicador de progreso de exportación
    const [exportState, setExportState] = useState<ExportState>({
        isExporting: false,
        format: null,
        progress: 0,
        statusText: '',
        isCompleted: false,
        error: null,
        filename: null,
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Limpieza de intervalos y abort controller al desmontar
    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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

    // Control de exportación asíncrona con barra de progreso
    const handleExport = async (format: 'excel' | 'pdf') => {
        if (exportState.isExporting) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const isExcel = format === 'excel';
        const url = isExcel ? exportExcelUrl : exportPdfUrl;

        setExportState({
            isExporting: true,
            format,
            progress: 12,
            statusText: isExcel
                ? 'Consultando registros en base de datos...'
                : 'Recopilando indicadores ejecutivos...',
            isCompleted: false,
            error: null,
            filename: null,
        });

        // Simular progreso fluido mientras el servidor compila y transmite
        let currentProgress = 12;
        progressIntervalRef.current = setInterval(() => {
            setExportState((prev) => {
                if (!prev.isExporting || prev.isCompleted) return prev;

                let increment = 0;
                if (currentProgress < 35) {
                    increment = Math.floor(Math.random() * 6) + 4;
                } else if (currentProgress < 70) {
                    increment = Math.floor(Math.random() * 5) + 3;
                } else if (currentProgress < 92) {
                    increment = Math.floor(Math.random() * 3) + 1;
                }

                currentProgress = Math.min(currentProgress + increment, 92);

                let statusText = prev.statusText;
                if (currentProgress > 70) {
                    statusText = isExcel
                        ? 'Estructurando hojas de cálculo y fórmulas...'
                        : 'Compilando maquetación y diseño ejecutivo...';
                } else if (currentProgress > 35) {
                    statusText = isExcel
                        ? 'Calculando métricas y totales de ventas...'
                        : 'Renderizando tablas comparativas...';
                }

                return {
                    ...prev,
                    progress: currentProgress,
                    statusText,
                };
            });
        }, 280);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Error del servidor (${response.status})`);
            }

            const disposition = response.headers.get('content-disposition');
            let filename = isExcel
                ? `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`
                : `Resumen_Directorio_${new Date().toISOString().slice(0, 10)}.pdf`;

            if (disposition && disposition.includes('filename=')) {
                const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (matches?.[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const blob = await response.blob();

            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }

            setExportState({
                isExporting: false,
                format,
                progress: 100,
                statusText: '¡Documento generado con éxito! Descarga lista.',
                isCompleted: true,
                error: null,
                filename,
            });

            // Disparar la descarga nativa en el navegador
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);

            // Cerrar automáticamente la notificación después de 3.5 segundos
            setTimeout(() => {
                setExportState((prev) => {
                    if (prev.isCompleted) {
                        return {
                            isExporting: false,
                            format: null,
                            progress: 0,
                            statusText: '',
                            isCompleted: false,
                            error: null,
                            filename: null,
                        };
                    }
                    return prev;
                });
            }, 3500);

        } catch (err: any) {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
            if (err.name === 'AbortError') {
                setExportState({
                    isExporting: false,
                    format: null,
                    progress: 0,
                    statusText: '',
                    isCompleted: false,
                    error: null,
                    filename: null,
                });
                return;
            }

            setExportState({
                isExporting: false,
                format,
                progress: 0,
                statusText: '',
                isCompleted: false,
                error: err.message || 'Error al generar el reporte. Intente nuevamente.',
                filename: null,
            });
        }
    };

    const handleCancelExport = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
        setExportState({
            isExporting: false,
            format: null,
            progress: 0,
            statusText: '',
            isCompleted: false,
            error: null,
            filename: null,
        });
    };

    const handleDismissExport = () => {
        setExportState({
            isExporting: false,
            format: null,
            progress: 0,
            statusText: '',
            isCompleted: false,
            error: null,
            filename: null,
        });
    };

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

                    {/* Botones de Exportación Directa con Feedback Interactivo */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => handleExport('excel')}
                            disabled={exportState.isExporting}
                            className={cn(
                                "relative inline-flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-2 text-xs font-semibold shadow-xs transition-all duration-200 active:scale-[0.98]",
                                exportState.format === 'excel' && exportState.isExporting
                                    ? "border-emerald-600 bg-emerald-600 text-white cursor-wait"
                                    : exportState.format === 'excel' && exportState.isCompleted
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white",
                                exportState.isExporting && exportState.format !== 'excel' && "opacity-50 pointer-events-none"
                            )}
                        >
                            {exportState.format === 'excel' && exportState.isExporting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-white" />
                                    <span>Generando Excel... ({exportState.progress}%)</span>
                                </>
                            ) : exportState.format === 'excel' && exportState.isCompleted ? (
                                <>
                                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>¡Excel Descargado!</span>
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="size-4" />
                                    <span>Exportar Excel (.xlsx)</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExport('pdf')}
                            disabled={exportState.isExporting}
                            className={cn(
                                "relative inline-flex items-center gap-2 overflow-hidden rounded-xl border px-4 py-2 text-xs font-semibold shadow-xs transition-all duration-200 active:scale-[0.98]",
                                exportState.format === 'pdf' && exportState.isExporting
                                    ? "border-rose-500 bg-rose-500 text-white cursor-wait"
                                    : exportState.format === 'pdf' && exportState.isCompleted
                                    ? "border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300"
                                    : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
                                exportState.isExporting && exportState.format !== 'pdf' && "opacity-50 pointer-events-none"
                            )}
                        >
                            {exportState.format === 'pdf' && exportState.isExporting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-white" />
                                    <span>Generando PDF... ({exportState.progress}%)</span>
                                </>
                            ) : exportState.format === 'pdf' && exportState.isCompleted ? (
                                <>
                                    <Check className="size-4 text-rose-600 dark:text-rose-400" />
                                    <span>¡PDF Descargado!</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="size-4 text-rose-500" />
                                    <span>PDF Directorio (1 Pág)</span>
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Línea de Progreso Superior estilo Apple */}
                {exportState.isExporting && (
                    <div className="relative -mt-4 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                            className={cn(
                                "h-full transition-all duration-300 ease-out",
                                exportState.format === 'excel'
                                    ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"
                                    : "bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600"
                            )}
                            style={{ width: `${exportState.progress}%` }}
                        />
                    </div>
                )}

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

                {/* Notificación Flotante Dinámica estilo Apple */}
                <ExportProgressHUD
                    state={exportState}
                    onCancel={handleCancelExport}
                    onDismiss={handleDismissExport}
                />
            </div>
        </>
    );
}

