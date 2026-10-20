<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateMcpApiKey
{
    /**
     * Valida que la petición al conector MCP contenga una clave de API válida.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedKey = config('mcp.api_key', env('MCP_API_KEY'));

        // Si no hay clave configurada en el entorno, permitir temporalmente o bloquear
        if (empty($expectedKey)) {
            return $next($request);
        }

        // Obtener el token del encabezado Authorization: Bearer <token>
        $providedKey = $request->bearerToken();

        // Si no viene en Authorization, buscar en encabezado X-MCP-API-KEY o query param
        if (empty($providedKey)) {
            $providedKey = $request->header('X-MCP-API-KEY') ?: $request->query('api_key');
        }

        // Comparación segura en tiempo constante para mitigar timing attacks
        if (empty($providedKey) || ! hash_equals((string) $expectedKey, (string) $providedKey)) {
            return new JsonResponse([
                'jsonrpc' => '2.0',
                'error' => [
                    'code' => -32001,
                    'message' => 'Unauthorized: Invalid or missing MCP API Key. Use Authorization: Bearer <API_KEY>',
                ],
                'id' => $request->input('id'),
            ], 401);
        }

        return $next($request);
    }
}
