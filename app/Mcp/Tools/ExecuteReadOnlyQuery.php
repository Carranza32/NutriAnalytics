<?php

namespace App\Mcp\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;
use Laravel\Mcp\Server\Tools\Annotations\IsReadOnly;

#[Description('Ejecuta sentencias SQL personalizadas de SOLO LECTURA (SELECT o WITH ... SELECT) directamente contra la base de datos GeoSoft ERP (SQL Server). Permite resolver preguntas complejas, cruces especiales de datos, o consultas no contempladas en las herramientas predefinidas. Por seguridad, está bloqueada cualquier operación de escritura, modificación o eliminación.')]
#[IsReadOnly]
class ExecuteReadOnlyQuery extends Tool
{
    protected string $name = 'execute_read_only_query';

    protected string $title = 'Ejecutar Consulta SQL (Solo Lectura)';

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('Sentencia SQL de solo lectura a ejecutar (debe comenzar con SELECT o WITH). Ej. "SELECT TOP 10 codcli, nomcli, limcre FROM clientes WHERE limcre > 10000 ORDER BY limcre DESC"'),
            'purpose' => $schema->string()
                ->description('Breve explicación de la razón analítica de la consulta (ej. "Identificar clientes con mayor límite de crédito").'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'query' => ['required', 'string'],
            'purpose' => ['nullable', 'string', 'max:255'],
        ]);

        $rawSql = trim($validated['query']);
        $cleanedSql = rtrim($rawSql, ';');

        // 1. Validar que no contenga múltiples sentencias
        if (str_contains($cleanedSql, ';')) {
            return Response::structured([
                'success' => false,
                'error' => 'Por motivos de seguridad, solo se permite una única sentencia SQL por ejecución. No se permiten sentencias compuestas ni encadenadas con punto y coma.',
            ]);
        }

        // 2. Verificar que inicie con SELECT o WITH
        $normalized = strtoupper(ltrim($cleanedSql));
        if (! str_starts_with($normalized, 'SELECT') && ! str_starts_with($normalized, 'WITH')) {
            return Response::structured([
                'success' => false,
                'error' => 'La sentencia debe ser estrictamente de consulta y comenzar con SELECT o WITH (para expresiones comunes de tabla / CTEs).',
            ]);
        }

        // 3. Lista de comandos DDL / DML / Procedimientos prohibidos
        $forbiddenKeywords = [
            'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
            'EXEC', 'EXECUTE', 'SP_', 'XP_', 'GRANT', 'REVOKE', 'CREATE',
            'MERGE', 'BULK', 'OPENROWSET', 'OPENDATASOURCE', 'SHUTDOWN',
            'KILL', 'RESTORE', 'BACKUP', 'INTO',
        ];

        foreach ($forbiddenKeywords as $word) {
            if (preg_match('/\b' . preg_quote($word, '/') . '\b/i', $cleanedSql)) {
                return Response::structured([
                    'success' => false,
                    'error' => "Operación rechazada: La palabra clave '{$word}' está estrictamente prohibida en este conector de solo lectura.",
                ]);
            }
        }

        // 4. Ejecutar la consulta con medición de tiempo y límite de filas
        try {
            $startTime = microtime(true);
            $results = DB::select($cleanedSql);
            $durationMs = round((microtime(true) - $startTime) * 1000, 2);

            $totalCount = count($results);
            $maxRows = 100;
            $limited = array_slice($results, 0, $maxRows);

            // Sanitizar objetos/strings para UTF-8 limpio
            $cleanData = array_map(function ($row) {
                $item = [];
                foreach ((array) $row as $key => $val) {
                    $item[$key] = is_string($val) ? trim($val) : $val;
                }
                return $item;
            }, $limited);

            return Response::structured([
                'success' => true,
                'proposito' => $validated['purpose'] ?? 'Consulta analítica ad-hoc',
                'filas_retornadas' => count($cleanData),
                'filas_totales_obtenidas' => $totalCount,
                'tiempo_ejecucion_ms' => $durationMs,
                'aviso' => $totalCount > $maxRows ? "Se limitaron los resultados a las primeras {$maxRows} filas para proteger el rendimiento." : null,
                'datos' => $cleanData,
            ]);
        } catch (\Throwable $e) {
            return Response::structured([
                'success' => false,
                'error' => 'Error de sintaxis o ejecución en SQL Server: ' . $e->getMessage(),
                'sugerencia' => 'Usa la herramienta "get_table_schema" para revisar los nombres exactos de tablas y columnas.',
            ]);
        }
    }
}
