<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\GetLowStockProducts;
use App\Mcp\Tools\GetSalesSummary;
use App\Mcp\Tools\SearchProducts;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('NutriFertil Hub Agro Server')]
#[Version('1.0.0')]
#[Instructions('Servidor MCP empresarial para NutriAnalytics (NutriFertil Hub). Proporciona herramientas analíticas de solo lectura sobre el ERP agrícola: consulta de productos con quiebre o bajo stock, búsqueda de catálogo de fertilizantes e insumos, y resúmenes financieros y comerciales de ventas.')]
class AgroMcpServer extends Server
{
    /**
     * Herramientas analíticas expuestas a los clientes y agentes de IA.
     *
     * @var array<int, class-string>
     */
    protected array $tools = [
        GetLowStockProducts::class,
        SearchProducts::class,
        GetSalesSummary::class,
    ];

    /**
     * Recursos expuestos por el servidor.
     *
     * @var array<int, class-string>
     */
    protected array $resources = [
        //
    ];

    /**
     * Prompts predefinidos del servidor.
     *
     * @var array<int, class-string>
     */
    protected array $prompts = [
        //
    ];
}
