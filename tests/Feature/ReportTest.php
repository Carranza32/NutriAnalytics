<?php

use App\Models\User;
use App\Services\ReportService;

test('guests are redirected from reports to the login page', function () {
    $response = $this->get(route('reports.index'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can access the reports page', function () {
    $this->mock(ReportService::class, function ($mock) {
        $mock->shouldReceive('getReportData')
            ->once()
            ->andReturn([
                'filters' => [
                    'date_from' => '2026-01-01',
                    'date_to' => '2026-10-17',
                    'vendedor' => null,
                    'marca' => null,
                    'sucursal' => null,
                    'tipo' => 'ventas_detalle',
                    'search' => null,
                ],
                'filter_options' => [
                    'vendedores' => [],
                    'marcas' => [],
                    'sucursales' => [],
                    'tipos' => [],
                ],
                'kpis' => [
                    'total_revenue' => 100000.0,
                    'total_invoices' => 50,
                    'total_units' => 2000,
                    'total_clients' => 25,
                    'average_ticket' => 2000.0,
                ],
                'records' => [],
                'total_count' => 0,
            ]);
    });

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('reports.index'));
    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('reports/index')
            ->has('kpis')
            ->has('filters')
            ->has('filter_options')
        );
});
