<?php

use App\Mcp\Servers\AgroMcpServer;
use App\Mcp\Tools\GetLowStockProducts;
use App\Mcp\Tools\GetSalesSummary;
use App\Mcp\Tools\SearchProducts;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    if (! Schema::hasTable('products')) {
        $this->markTestSkipped('La base de datos de pruebas no contiene las tablas de Northwind.');
    }
});

test('agro mcp server executes get_low_stock_products tool successfully', function () {
    $response = AgroMcpServer::tool(GetLowStockProducts::class, [
        'limit' => 5,
    ]);

    $response->assertOk();
    $response->assertSee('total_alert_products');
});

test('agro mcp server executes search_products tool successfully', function () {
    $response = AgroMcpServer::tool(SearchProducts::class, [
        'query' => 'Chai',
        'limit' => 5,
    ]);

    $response->assertOk();
    $response->assertSee('Chai');
});

test('agro mcp server executes get_sales_summary tool successfully', function () {
    $response = AgroMcpServer::tool(GetSalesSummary::class, [
        'from_date' => '1997-01-01',
        'to_date' => '1997-12-31',
        'limit_orders' => 3,
    ]);

    $response->assertOk();
    $response->assertSee('total_revenue');
    $response->assertSee('average_order_value');
});
