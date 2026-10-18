<?php

namespace App\Mcp\Servers;

use App\Mcp\Resources\CatalogoMarcas;
use App\Mcp\Resources\CatalogoSucursales;
use App\Mcp\Resources\CatalogoVendedores;
use App\Mcp\Tools\ExecuteReadOnlyQuery;
use App\Mcp\Tools\GetAccountsReceivable;
use App\Mcp\Tools\GetExecutiveKpis;
use App\Mcp\Tools\GetSalesAnalytics;
use App\Mcp\Tools\GetTableSchema;
use App\Mcp\Tools\GetTopProducts;
use App\Mcp\Tools\SearchInventoryAndStock;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('NutriAnalytics AI Intelligence Server')]
#[Version('2.0.0')]
#[Instructions('Servidor MCP analítico oficial de NutriAnalytics conectado en tiempo real al ERP GeoSoft (SQL Server). Actúa como Director de Inteligencia de Negocios y Analista Comercial Senior: responde preguntas sobre ventas, facturación, ticket promedio, cartera vencida (CxC), alertas de inventario y stock de fertilizantes e insumos agrícolas. Para consultas muy específicas o no cubiertas por las herramientas predefinidas, puedes inspeccionar el esquema con get_table_schema y ejecutar sentencias SQL de solo lectura con execute_read_only_query. Todos los montos monetarios se expresan en Dólares Estadounidenses ($ USD).')]
class AgroMcpServer extends Server
{
    /**
     * Herramientas analíticas expuestas a los clientes y agentes de IA.
     *
     * @var array<int, class-string>
     */
    protected array $tools = [
        GetExecutiveKpis::class,
        SearchInventoryAndStock::class,
        GetSalesAnalytics::class,
        GetAccountsReceivable::class,
        GetTopProducts::class,
        GetTableSchema::class,
        ExecuteReadOnlyQuery::class,
    ];

    /**
     * Recursos estáticos y catálogos maestros expuestos por el servidor.
     *
     * @var array<int, class-string>
     */
    protected array $resources = [
        CatalogoSucursales::class,
        CatalogoVendedores::class,
        CatalogoMarcas::class,
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
