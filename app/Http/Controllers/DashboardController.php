<?php

namespace App\Http\Controllers;

use App\Services\DashboardAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardAnalyticsService $analyticsService
    ) {}

    /**
     * Muestra el dashboard analítico principal.
     */
    public function index(Request $request): Response
    {
        $period = $request->query('period', '2026');
        $sucursal = $request->query('sucursal', 'all');
        $forceRefresh = $request->boolean('refresh', false);

        $dashboardData = $this->analyticsService->getDashboardData(
            is_string($period) ? $period : '2026',
            is_string($sucursal) ? $sucursal : 'all',
            $forceRefresh
        );

        return Inertia::render('dashboard', $dashboardData);
    }
}
