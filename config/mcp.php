<?php

return [
    /*
    |--------------------------------------------------------------------------
    | MCP Server API Key
    |--------------------------------------------------------------------------
    |
    | Clave secreta para autenticar las conexiones remotas a los servidores MCP
    | de NutriAnalytics. Si está configurada, los clientes (Claude, Cursor, etc.)
    | deben enviar el encabezado 'Authorization: Bearer <MCP_API_KEY>'.
    |
    */
    'api_key' => env('MCP_API_KEY'),
];
