<?php

use App\Http\Middleware\ValidateMcpApiKey;
use App\Mcp\Servers\AgroMcpServer;
use Laravel\Mcp\Facades\Mcp;

/*
|--------------------------------------------------------------------------
| Servidores MCP de NutriAnalytics (NutriFertil Hub)
|--------------------------------------------------------------------------
|
| Aquí se registran los transportes del servidor MCP Agro:
| 1. Mcp::local() habilita el transporte STDIO ('php artisan mcp:start agro')
|    ideal para clientes locales como Claude Desktop.
| 2. Mcp::web() habilita el transporte Streamable HTTP (POST /mcp/agro)
|    protegido por ValidateMcpApiKey (Authorization: Bearer <MCP_API_KEY>).
|
*/

Mcp::local('agro', AgroMcpServer::class);

Mcp::web('/mcp/agro', AgroMcpServer::class)
    ->middleware(ValidateMcpApiKey::class);
