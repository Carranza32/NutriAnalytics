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
        $period = $request->query('period', 'all');
        $dashboardData = $this->analyticsService->getDashboardData(is_string($period) ? $period : 'all');

        return Inertia::render('dashboard', $dashboardData);
    }
}
