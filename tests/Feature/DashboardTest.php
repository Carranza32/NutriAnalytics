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
            ]);
    });

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});
