<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    /**
     * Muestra la vista interactiva del Centro de Reportería.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['date_from', 'date_to', 'vendedor', 'marca', 'sucursal', 'tipo', 'search']);
        $reportData = $this->reportService->getReportData($filters, 60);

        return Inertia::render('reports/index', $reportData);
    }

    /**
     * Exporta el reporte filtrado a Excel nativo (.xlsx).
     */
    public function exportExcel(Request $request): SymfonyResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'vendedor', 'marca', 'sucursal', 'tipo', 'search']);

        return $this->reportService->exportExcel($filters);
    }

    /**
     * Exporta el reporte en PDF Ejecutivo de 1 página para el directorio.
     */
    public function exportPdf(Request $request): SymfonyResponse
    {
        $filters = $request->only(['date_from', 'date_to', 'vendedor', 'marca', 'sucursal', 'tipo', 'search']);

        return $this->reportService->exportPdf($filters);
    }
}
