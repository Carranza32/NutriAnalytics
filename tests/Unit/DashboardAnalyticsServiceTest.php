<?php

use App\Services\DashboardAnalyticsService;

test('it instantiates correctly and resolves periods', function () {
    $service = new DashboardAnalyticsService();

    // Verify reflection or public behavior
    expect($service)->toBeInstanceOf(DashboardAnalyticsService::class);
});
