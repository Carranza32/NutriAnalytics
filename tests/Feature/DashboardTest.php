<?php

use App\Models\User;
use App\Services\DashboardAnalyticsService;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->mock(DashboardAnalyticsService::class, function ($mock) {
        $mock->shouldReceive('getDashboardData')
            ->once()
            ->andReturn([
                'period' => 'all',
                'available_periods' => [
                    ['id' => 'all', 'label' => 'Histórico Total'],
                ],
                'kpis' => [
                    'total_revenue' => 1250000.0,
                    'total_orders' => 830,
                    'total_units_sold' => 51317,
                    'average_order_value' => 1506.0,
                    'low_stock_count' => 17,
                    'active_products_count' => 67,
                ],
                'sales_trend' => [],
                'category_distribution' => [],
                'top_products' => [],
                'geo_distribution' => [],
                'recent_orders' => [],
                'low_stock_alerts' => [],
                'yoy_comparison' => [
                    'kpis' => ['current_ytd' => 0, 'previous_ytd' => 0, 'growth_rate' => 0, 'revenue_difference' => 0, 'projected_year_end' => 0],
                    'monthly_comparison' => [],
                ],
                'cxc_matrix' => [
                    'kpis' => ['total_portfolio' => 0, 'current_portfolio' => 0, 'overdue_portfolio' => 0, 'overdue_plus_90' => 0, 'overdue_rate' => 0, 'total_pending_invoices' => 0],
                    'aging_distribution' => [],
                    'top_debtors' => [],
                    'top_clients' => [],
                    'churn_risk_clients' => [],
                ],
                'supply_chain' => [
                    'kpis' => ['total_criticos' => 0, 'venta_en_juego_critica' => 0, 'total_alerta' => 0, 'venta_en_juego_alerta' => 0, 'total_optimo' => 0, 'total_exceso' => 0],
                    'predictive_alerts' => [],
                    'items' => [],
                ],
            ]);
    });

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('supply_chain')
            ->has('yoy_comparison')
            ->has('cxc_matrix')
        );
});
