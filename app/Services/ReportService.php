<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportService
{
    /**
     * Obtiene las opciones disponibles para los filtros dinámicos.
     */
    public function getFilterOptions(): array
    {
        $vendedores = DB::table('vendedores')
            ->select(DB::raw('RTRIM(codven) as id'), DB::raw('RTRIM(nomven) as name'))
            ->whereNotNull('nomven')
            ->orderBy('name')
            ->get();

        $marcas = DB::table('rubros')
            ->select(DB::raw('RTRIM(codrub) as id'), DB::raw('RTRIM(nomrub) as name'))
            ->whereNotNull('nomrub')
            ->orderBy('name')
            ->get();

        $sucursales = DB::table('sucursales')
            ->select(DB::raw('RTRIM(codsuc) as id'), DB::raw('RTRIM(nomsuc) as name'))
            ->whereNotNull('nomsuc')
            ->orderBy('name')
            ->get();

        return [
            'vendedores' => $vendedores,
            'marcas' => $marcas,
            'sucursales' => $sucursales,
            'tipos' => [
                ['id' => 'ventas_detalle', 'name' => 'Ventas Detalladas por Renglón'],
                ['id' => 'por_vendedor', 'name' => 'Resumen por Vendedor'],
                ['id' => 'por_marca', 'name' => 'Resumen por Marca / Línea'],
                ['id' => 'por_sucursal', 'name' => 'Resumen por Sucursal'],
            ],
        ];
    }

    /**
     * Resuelve y sanitiza los filtros del reporte.
     */
    public function resolveFilters(array $filters): array
    {
        $dateFrom = ! empty($filters['date_from']) ? $filters['date_from'] : '2026-01-01';
        $dateTo = ! empty($filters['date_to']) ? $filters['date_to'] : Carbon::now()->format('Y-m-d');
        $tipo = in_array($filters['tipo'] ?? '', ['ventas_detalle', 'por_vendedor', 'por_marca', 'por_sucursal'], true)
            ? $filters['tipo']
            : 'ventas_detalle';

        return [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'vendedor' => ! empty($filters['vendedor']) ? trim((string) $filters['vendedor']) : null,
            'marca' => ! empty($filters['marca']) ? trim((string) $filters['marca']) : null,
            'sucursal' => ! empty($filters['sucursal']) ? trim((string) $filters['sucursal']) : null,
            'tipo' => $tipo,
            'search' => ! empty($filters['search']) ? trim((string) $filters['search']) : null,
        ];
    }

    /**
     * Construye la consulta base para el reporte filtrado.
     */
    protected function buildBaseQuery(array $filters)
    {
        $query = DB::table('Encfct as e')
            ->join('detfct as d', 'e.ID_Fac', '=', 'd.ID_Fac')
            ->leftJoin('clientes as c', DB::raw('RTRIM(e.codcli)'), '=', DB::raw('RTRIM(c.codcli)'))
            ->leftJoin('vendedores as v', DB::raw('RTRIM(e.codven)'), '=', DB::raw('RTRIM(v.codven)'))
            ->leftJoin('sucursales as s', DB::raw('RTRIM(e.codsuc)'), '=', DB::raw('RTRIM(s.codsuc)'))
            ->leftJoin('productos as p', DB::raw('RTRIM(d.codprd)'), '=', DB::raw('RTRIM(p.codprd)'))
            ->leftJoin('rubros as r', DB::raw('RTRIM(p.codrub)'), '=', DB::raw('RTRIM(r.codrub)'))
            ->where('e.estado', '!=', 'A');

        if (! empty($filters['date_from'])) {
            $query->whereDate('e.fecfct', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('e.fecfct', '<=', $filters['date_to']);
        }

        if (! empty($filters['vendedor'])) {
            $query->where(DB::raw('RTRIM(e.codven)'), $filters['vendedor']);
        }

        if (! empty($filters['marca'])) {
            $query->where(DB::raw('RTRIM(p.codrub)'), $filters['marca']);
        }

        if (! empty($filters['sucursal'])) {
            $query->where(DB::raw('RTRIM(e.codsuc)'), $filters['sucursal']);
        }

        if (! empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($search) {
                $q->where('e.numfct', 'like', $search)
                    ->orWhere('c.nomcli', 'like', $search)
                    ->orWhere('p.nomprd', 'like', $search)
                    ->orWhere('d.codprd', 'like', $search);
            });
        }

        return $query;
    }

    /**
     * Obtiene los datos del reporte para la visualización interactiva.
     */
    public function getReportData(array $filters, int $limit = 50): array
    {
        $filters = $this->resolveFilters($filters);
        $baseQuery = $this->buildBaseQuery($filters);

        // KPIs calculados
        $kpisRaw = (clone $baseQuery)
            ->selectRaw('
                COUNT(DISTINCT e.ID_Fac) as total_invoices,
                COUNT(DISTINCT e.codcli) as total_clients,
                ROUND(SUM(d.qtyvta), 2) as total_units,
                ROUND(SUM(d.qtyvta * d.prcact), 2) as total_revenue
            ')
            ->first();

        $totalRevenue = (float) ($kpisRaw->total_revenue ?? 0);
        $totalInvoices = (int) ($kpisRaw->total_invoices ?? 0);
        $totalUnits = (float) ($kpisRaw->total_units ?? 0);
        $totalClients = (int) ($kpisRaw->total_clients ?? 0);
        $avgTicket = $totalInvoices > 0 ? round($totalRevenue / $totalInvoices, 2) : 0;

        $kpis = [
            'total_revenue' => $totalRevenue,
            'total_invoices' => $totalInvoices,
            'total_units' => $totalUnits,
            'total_clients' => $totalClients,
            'average_ticket' => $avgTicket,
        ];

        $records = match ($filters['tipo']) {
            'por_vendedor' => $this->getSalesBySeller($filters),
            'por_marca' => $this->getSalesByBrand($filters),
            'por_sucursal' => $this->getSalesByBranch($filters),
            default => $this->getDetailedSales($filters, $limit),
        };

        return [
            'filters' => $filters,
            'filter_options' => $this->getFilterOptions(),
            'kpis' => $kpis,
            'records' => $records,
            'total_count' => count($records),
        ];
    }

    /**
     * Renglones detallados de venta.
     */
    protected function getDetailedSales(array $filters, int $limit = 50): array
    {
        return $this->buildBaseQuery($filters)
            ->select([
                'e.numfct',
                DB::raw("FORMAT(e.fecfct, 'yyyy-MM-dd') as fecfct"),
                DB::raw('RTRIM(COALESCE(c.nomcli, e.codcli)) as cliente'),
                DB::raw('RTRIM(COALESCE(v.nomven, e.codven)) as vendedor'),
                DB::raw('RTRIM(COALESCE(s.nomsuc, e.codsuc)) as sucursal'),
                DB::raw('RTRIM(d.codprd) as codprd'),
                DB::raw('RTRIM(p.nomprd) as producto'),
                DB::raw('RTRIM(COALESCE(r.nomrub, \'SIN MARCA\')) as marca'),
                DB::raw('ROUND(d.qtyvta, 2) as cantidad'),
                DB::raw('ROUND(d.prcact, 2) as precio'),
                DB::raw('ROUND(d.qtyvta * d.prcact, 2) as subtotal'),
            ])
            ->orderByDesc('e.fecfct')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();
    }

    /**
     * Agrupado por vendedor.
     */
    protected function getSalesBySeller(array $filters): array
    {
        return $this->buildBaseQuery($filters)
            ->select([
                DB::raw('RTRIM(COALESCE(v.nomven, e.codven)) as vendedor'),
                DB::raw('COUNT(DISTINCT e.ID_Fac) as total_facturas'),
                DB::raw('COUNT(DISTINCT e.codcli) as total_clientes'),
                DB::raw('ROUND(SUM(d.qtyvta), 2) as unidades'),
                DB::raw('ROUND(SUM(d.qtyvta * d.prcact), 2) as total_facturado'),
                DB::raw('ROUND(SUM(d.qtyvta * d.prcact) / NULLIF(COUNT(DISTINCT e.ID_Fac), 0), 2) as ticket_promedio'),
            ])
            ->groupBy(DB::raw('RTRIM(COALESCE(v.nomven, e.codven))'))
            ->orderByDesc(DB::raw('SUM(d.qtyvta * d.prcact)'))
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();
    }

    /**
     * Agrupado por marca / rubro.
     */
    protected function getSalesByBrand(array $filters): array
    {
        return $this->buildBaseQuery($filters)
            ->select([
                DB::raw('RTRIM(COALESCE(r.nomrub, \'SIN MARCA\')) as marca'),
                DB::raw('COUNT(DISTINCT p.codprd) as productos_vendidos'),
                DB::raw('ROUND(SUM(d.qtyvta), 2) as unidades'),
                DB::raw('ROUND(SUM(d.qtyvta * d.prcact), 2) as total_facturado'),
            ])
            ->groupBy(DB::raw('RTRIM(COALESCE(r.nomrub, \'SIN MARCA\'))'))
            ->orderByDesc(DB::raw('SUM(d.qtyvta * d.prcact)'))
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();
    }

    /**
     * Agrupado por sucursal.
     */
    protected function getSalesByBranch(array $filters): array
    {
        return $this->buildBaseQuery($filters)
            ->select([
                DB::raw('RTRIM(COALESCE(s.nomsuc, e.codsuc)) as sucursal'),
                DB::raw('COUNT(DISTINCT e.ID_Fac) as total_facturas'),
                DB::raw('ROUND(SUM(d.qtyvta), 2) as unidades'),
                DB::raw('ROUND(SUM(d.qtyvta * d.prcact), 2) as total_facturado'),
            ])
            ->groupBy(DB::raw('RTRIM(COALESCE(s.nomsuc, e.codsuc))'))
            ->orderByDesc(DB::raw('SUM(d.qtyvta * d.prcact)'))
            ->get()
            ->map(fn ($r) => (array) $r)
            ->toArray();
    }

    /**
     * Exporta el reporte a Excel nativo (.xlsx) con celdas limpias, encabezados con estilo y fórmulas.
     */
    public function exportExcel(array $filters): StreamedResponse
    {
        $filters = $this->resolveFilters($filters);
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte GeoSoft');

        // Configuración de estilo corporativo
        $spreadsheet->getDefaultStyle()->getFont()->setName('Segoe UI')->setSize(10);

        // Título del reporte
        $sheet->setCellValue('A1', 'NUTRIFERTIL HUB • CENTRO DE REPORTERÍA EJECUTIVA');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new Color('1E5E3A'));

        $subtitulo = "Período: {$filters['date_from']} al {$filters['date_to']} | Tipo: {$filters['tipo']}";
        if ($filters['vendedor']) {
            $subtitulo .= " | Vendedor: {$filters['vendedor']}";
        }
        if ($filters['marca']) {
            $subtitulo .= " | Marca: {$filters['marca']}";
        }
        if ($filters['sucursal']) {
            $subtitulo .= " | Sucursal: {$filters['sucursal']}";
        }
        $sheet->setCellValue('A2', $subtitulo);
        $sheet->getStyle('A2')->getFont()->setSize(9)->setItalic(true)->setColor(new Color('555555'));

        $rowNum = 4;

        if ($filters['tipo'] === 'por_vendedor') {
            $headers = ['Vendedor', 'Facturas Emitidas', 'Clientes Atendidos', 'Unidades Vendidas', 'Total Facturado ($)', 'Ticket Promedio ($)'];
            $data = $this->getSalesBySeller($filters);

            // Cabeceras
            $sheet->fromArray($headers, null, "A{$rowNum}");
            $this->styleHeaderRow($sheet, "A{$rowNum}:F{$rowNum}");
            $rowNum++;

            $startDataRow = $rowNum;
            foreach ($data as $item) {
                $sheet->setCellValue("A{$rowNum}", $item['vendedor']);
                $sheet->setCellValue("B{$rowNum}", $item['total_facturas']);
                $sheet->setCellValue("C{$rowNum}", $item['total_clientes']);
                $sheet->setCellValue("D{$rowNum}", $item['unidades']);
                $sheet->setCellValue("E{$rowNum}", $item['total_facturado']);
                $sheet->setCellValue("F{$rowNum}", $item['ticket_promedio']);

                $sheet->getStyle("B{$rowNum}:D{$rowNum}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("E{$rowNum}:F{$rowNum}")->getNumberFormat()->setFormatCode('$#,##0.00');
                $rowNum++;
            }

            // Fila de totales
            $sheet->setCellValue("A{$rowNum}", 'TOTAL GENERAL');
            $sheet->setCellValue("B{$rowNum}", "=SUM(B{$startDataRow}:B".($rowNum - 1).')');
            $sheet->setCellValue("C{$rowNum}", "=SUM(C{$startDataRow}:C".($rowNum - 1).')');
            $sheet->setCellValue("D{$rowNum}", "=SUM(D{$startDataRow}:D".($rowNum - 1).')');
            $sheet->setCellValue("E{$rowNum}", "=SUM(E{$startDataRow}:E".($rowNum - 1).')');
            $sheet->setCellValue("F{$rowNum}", "=AVERAGE(F{$startDataRow}:F".($rowNum - 1).')');
            $this->styleTotalRow($sheet, "A{$rowNum}:F{$rowNum}");

        } elseif ($filters['tipo'] === 'por_marca') {
            $headers = ['Marca / Línea', 'Productos Activos', 'Unidades Vendidas', 'Total Facturado ($)'];
            $data = $this->getSalesByBrand($filters);

            $sheet->fromArray($headers, null, "A{$rowNum}");
            $this->styleHeaderRow($sheet, "A{$rowNum}:D{$rowNum}");
            $rowNum++;

            $startDataRow = $rowNum;
            foreach ($data as $item) {
                $sheet->setCellValue("A{$rowNum}", $item['marca']);
                $sheet->setCellValue("B{$rowNum}", $item['productos_vendidos']);
                $sheet->setCellValue("C{$rowNum}", $item['unidades']);
                $sheet->setCellValue("D{$rowNum}", $item['total_facturado']);

                $sheet->getStyle("B{$rowNum}:C{$rowNum}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("D{$rowNum}")->getNumberFormat()->setFormatCode('$#,##0.00');
                $rowNum++;
            }

            $sheet->setCellValue("A{$rowNum}", 'TOTAL GENERAL');
            $sheet->setCellValue("B{$rowNum}", "=SUM(B{$startDataRow}:B".($rowNum - 1).')');
            $sheet->setCellValue("C{$rowNum}", "=SUM(C{$startDataRow}:C".($rowNum - 1).')');
            $sheet->setCellValue("D{$rowNum}", "=SUM(D{$startDataRow}:D".($rowNum - 1).')');
            $this->styleTotalRow($sheet, "A{$rowNum}:D{$rowNum}");

        } elseif ($filters['tipo'] === 'por_sucursal') {
            $headers = ['Sucursal', 'Facturas Emitidas', 'Unidades Vendidas', 'Total Facturado ($)'];
            $data = $this->getSalesByBranch($filters);

            $sheet->fromArray($headers, null, "A{$rowNum}");
            $this->styleHeaderRow($sheet, "A{$rowNum}:D{$rowNum}");
            $rowNum++;

            $startDataRow = $rowNum;
            foreach ($data as $item) {
                $sheet->setCellValue("A{$rowNum}", $item['sucursal']);
                $sheet->setCellValue("B{$rowNum}", $item['total_facturas']);
                $sheet->setCellValue("C{$rowNum}", $item['unidades']);
                $sheet->setCellValue("D{$rowNum}", $item['total_facturado']);

                $sheet->getStyle("B{$rowNum}:C{$rowNum}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("D{$rowNum}")->getNumberFormat()->setFormatCode('$#,##0.00');
                $rowNum++;
            }

            $sheet->setCellValue("A{$rowNum}", 'TOTAL GENERAL');
            $sheet->setCellValue("B{$rowNum}", "=SUM(B{$startDataRow}:B".($rowNum - 1).')');
            $sheet->setCellValue("C{$rowNum}", "=SUM(C{$startDataRow}:C".($rowNum - 1).')');
            $sheet->setCellValue("D{$rowNum}", "=SUM(D{$startDataRow}:D".($rowNum - 1).')');
            $this->styleTotalRow($sheet, "A{$rowNum}:D{$rowNum}");

        } else {
            // Detalle de ventas (hasta 2,500 renglones para descarga fluida)
            $headers = ['N° Factura', 'Fecha', 'Cliente', 'Vendedor', 'Sucursal', 'Código', 'Producto', 'Marca', 'Cantidad', 'Precio Unit ($)', 'Subtotal ($)'];
            $data = $this->getDetailedSales($filters, 2500);

            $sheet->fromArray($headers, null, "A{$rowNum}");
            $this->styleHeaderRow($sheet, "A{$rowNum}:K{$rowNum}");
            $rowNum++;

            $startDataRow = $rowNum;
            foreach ($data as $item) {
                $sheet->setCellValue("A{$rowNum}", $item['numfct']);
                $sheet->setCellValue("B{$rowNum}", $item['fecfct']);
                $sheet->setCellValue("C{$rowNum}", $item['cliente']);
                $sheet->setCellValue("D{$rowNum}", $item['vendedor']);
                $sheet->setCellValue("E{$rowNum}", $item['sucursal']);
                $sheet->setCellValue("F{$rowNum}", $item['codprd']);
                $sheet->setCellValue("G{$rowNum}", $item['producto']);
                $sheet->setCellValue("H{$rowNum}", $item['marca']);
                $sheet->setCellValue("I{$rowNum}", $item['cantidad']);
                $sheet->setCellValue("J{$rowNum}", $item['precio']);
                $sheet->setCellValue("K{$rowNum}", $item['subtotal']);

                $sheet->getStyle("I{$rowNum}")->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getStyle("J{$rowNum}:K{$rowNum}")->getNumberFormat()->setFormatCode('$#,##0.00');
                $rowNum++;
            }

            $sheet->setCellValue("A{$rowNum}", 'TOTAL GENERAL');
            $sheet->setCellValue("I{$rowNum}", "=SUM(I{$startDataRow}:I".($rowNum - 1).')');
            $sheet->setCellValue("K{$rowNum}", "=SUM(K{$startDataRow}:K".($rowNum - 1).')');
            $this->styleTotalRow($sheet, "A{$rowNum}:K{$rowNum}");
        }

        // Auto-dimensionar columnas para legibilidad perfecta
        foreach (range('A', $sheet->getHighestColumn()) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Reporte_Ventas_'.Carbon::now()->format('Ymd_His').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Aplica el estilo al encabezado de la tabla Excel.
     */
    protected function styleHeaderRow($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 10,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E5E3A'], // Verde Agro Corporativo
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
    }

    /**
     * Aplica el estilo a la fila de totales en Excel.
     */
    protected function styleTotalRow($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => '000000'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'EAEAEA'],
            ],
            'borders' => [
                'top' => ['borderStyle' => Border::BORDER_THIN],
                'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
            ],
        ]);
    }

    /**
     * Genera un PDF Ejecutivo de 1 página optimizado para juntas directivas.
     */
    public function exportPdf(array $filters)
    {
        $data = $this->getReportData($filters, 15);

        // Top Vendedores y Top Marcas para la junta directiva
        $topSellers = array_slice($this->getSalesBySeller($filters), 0, 7);
        $topBrands = array_slice($this->getSalesByBrand($filters), 0, 7);

        $pdf = Pdf::loadView('reports.executive-pdf', [
            'filters' => $data['filters'],
            'kpis' => $data['kpis'],
            'topSellers' => $topSellers,
            'topBrands' => $topBrands,
            'recentSales' => $data['records'],
            'generatedAt' => Carbon::now()->format('d/m/Y H:i:s'),
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = 'Resumen_Ejecutivo_Directorio_'.Carbon::now()->format('Ymd').'.pdf';

        return $pdf->download($filename);
    }
}
