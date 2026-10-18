<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExportToPostgresSql extends Command
{
    protected $signature = 'db:export-postgres
                            {--file=database/geopost_pyme_supabase.sql : Ruta del archivo SQL de salida}
                            {--schema-only : Exportar únicamente la estructura e índices sin los datos}';

    protected $description = 'Exporta toda la base de datos SQL Server (GeoPost_Pyme) a un script SQL compatible con PostgreSQL / Supabase';

    public function handle(): int
    {
        $this->info('Iniciando exportación de GeoPost_Pyme hacia PostgreSQL / Supabase...');

        $filePath = base_path($this->option('file'));
        $dir = dirname($filePath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($filePath, 'w');
        if (! $handle) {
            $this->error("No se pudo abrir el archivo para escritura: {$filePath}");
            return Command::FAILURE;
        }

        // 1. Cabecera y Funciones de compatibilidad T-SQL -> PostgreSQL
        fwrite($handle, "-- ==========================================================\n");
        fwrite($handle, "-- NutriAnalytics - Script de Migración GeoSoft a Supabase / PostgreSQL\n");
        fwrite($handle, "-- Generado automáticamente: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "-- ==========================================================\n\n");

        fwrite($handle, "SET client_encoding = 'UTF8';\n");
        fwrite($handle, "SET standard_conforming_strings = on;\n\n");

        // Funciones de compatibilidad para que todas las consultas T-SQL funcionen igual
        fwrite($handle, "-- Funciones de compatibilidad T-SQL en PostgreSQL\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION month(d timestamp) RETURNS integer AS $$ SELECT EXTRACT(MONTH FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION month(d date) RETURNS integer AS $$ SELECT EXTRACT(MONTH FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION year(d timestamp) RETURNS integer AS $$ SELECT EXTRACT(YEAR FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION year(d date) RETURNS integer AS $$ SELECT EXTRACT(YEAR FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION datediff(units text, d1 date, d2 date) RETURNS integer AS $$ SELECT (d2 - d1)::integer; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION datediff(units text, d1 timestamp, d2 timestamp) RETURNS integer AS $$ SELECT (DATE(d2) - DATE(d1))::integer; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION round(val double precision, places integer) RETURNS double precision AS $$ SELECT round(val::numeric, places)::double precision; $$ LANGUAGE sql IMMUTABLE;\n");
        fwrite($handle, "CREATE OR REPLACE FUNCTION isnull(val anyelement, fallback anyelement) RETURNS anyelement AS $$ SELECT COALESCE(val, fallback); $$ LANGUAGE sql IMMUTABLE;\n\n");

        $tables = [
            'sucursales',
            'vendedores',
            'rubros',
            'clientes',
            'productos',
            'existencias',
            'encfct',
            'detfct',
            'movcxc',
        ];

        // Mapeo de nombres en SQL Server
        $sqlServerTables = [
            'sucursales' => 'sucursales',
            'vendedores' => 'vendedores',
            'rubros' => 'rubros',
            'clientes' => 'clientes',
            'productos' => 'productos',
            'existencias' => 'Existencias',
            'encfct' => 'Encfct',
            'detfct' => 'detfct',
            'movcxc' => 'movcxc',
        ];

        foreach ($tables as $targetTable) {
            $sourceTable = $sqlServerTables[$targetTable];
            $this->info("Exportando tabla: {$sourceTable} -> {$targetTable}...");

            // Obtener columnas de SQL Server
            $columns = DB::select("
                SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            ", [$sourceTable]);

            if (empty($columns)) {
                $this->warn("No se encontraron columnas para {$sourceTable}, saltando...");
                continue;
            }

            // DDL: DROP & CREATE TABLE en PostgreSQL
            fwrite($handle, "-- ----------------------------------------------------------\n");
            fwrite($handle, "-- Tabla: {$targetTable}\n");
            fwrite($handle, "-- ----------------------------------------------------------\n");
            fwrite($handle, "DROP TABLE IF EXISTS \"{$targetTable}\" CASCADE;\n");
            fwrite($handle, "CREATE TABLE \"{$targetTable}\" (\n");

            $columnDefs = [];
            $colNames = [];
            foreach ($columns as $col) {
                $colName = strtolower(trim($col->COLUMN_NAME));
                $colNames[] = $colName;
                $sqlType = strtolower($col->DATA_TYPE);

                $pgType = match ($sqlType) {
                    'int', 'smallint', 'tinyint' => 'INTEGER',
                    'bigint' => 'BIGINT',
                    'decimal', 'numeric', 'money', 'smallmoney' => (($col->NUMERIC_SCALE !== null && (int)$col->NUMERIC_SCALE === 0 && ($col->NUMERIC_PRECISION ?: 18) <= 9)) ? 'INTEGER' : 'NUMERIC',
                    'float', 'real' => 'DOUBLE PRECISION',
                    'datetime', 'datetime2', 'smalldatetime' => 'TIMESTAMP',
                    'date' => 'DATE',
                    'bit' => 'BOOLEAN',
                    'text', 'ntext' => 'TEXT',
                    default => ($col->CHARACTER_MAXIMUM_LENGTH > 0 && $col->CHARACTER_MAXIMUM_LENGTH <= 2000)
                        ? "VARCHAR({$col->CHARACTER_MAXIMUM_LENGTH})"
                        : 'TEXT',
                };

                $columnDefs[] = "    \"{$colName}\" {$pgType}";
            }

            fwrite($handle, implode(",\n", $columnDefs));
            fwrite($handle, "\n);\n\n");

            if (! $this->option('schema-only')) {
                // Extraer e insertar datos en bloques
                $totalRows = DB::table($sourceTable)->count();
                $this->output->progressStart($totalRows);

                DB::table($sourceTable)->orderBy(DB::raw('1'))->chunk(1000, function ($rows) use ($handle, $targetTable, $colNames, $columns) {
                    if ($rows->isEmpty()) return;

                    $quotedCols = array_map(fn($c) => "\"{$c}\"", $colNames);
                    $insertPrefix = "INSERT INTO \"{$targetTable}\" (" . implode(', ', $quotedCols) . ") VALUES\n";
                    fwrite($handle, $insertPrefix);

                    $valueLines = [];
                    foreach ($rows as $row) {
                        $rowArray = (array) $row;
                        $vals = [];
                        foreach ($columns as $col) {
                            $origCol = $col->COLUMN_NAME;
                            $val = $rowArray[$origCol] ?? null;

                            if ($val === null) {
                                $vals[] = 'NULL';
                            } elseif (is_bool($val)) {
                                $vals[] = $val ? 'TRUE' : 'FALSE';
                            } elseif (is_numeric($val) && ! str_contains(strtolower($col->DATA_TYPE), 'char')) {
                                $vals[] = (string) $val;
                            } else {
                                $cleaned = str_replace("'", "''", trim((string) $val));
                                $vals[] = "'{$cleaned}'";
                            }
                        }
                        $valueLines[] = '(' . implode(', ', $vals) . ')';
                    }

                    fwrite($handle, implode(",\n", $valueLines) . ";\n\n");
                    $this->output->progressAdvance(count($rows));
                });

                $this->output->progressFinish();
            }
            fwrite($handle, "\n");
        }

        // Crear Índices de Rendimiento en PostgreSQL
        fwrite($handle, "-- ==========================================================\n");
        fwrite($handle, "-- Índices de Alto Rendimiento para Analíticas y Reportería\n");
        fwrite($handle, "-- ==========================================================\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_encfct_fecfct ON \"encfct\" (\"fecfct\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_encfct_codsuc ON \"encfct\" (\"codsuc\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_encfct_codven ON \"encfct\" (\"codven\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_encfct_codcli ON \"encfct\" (\"codcli\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_encfct_id_fac ON \"encfct\" (\"id_fac\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_detfct_id_fac ON \"detfct\" (\"id_fac\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_detfct_codprd ON \"detfct\" (\"codprd\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_existencias_codprd ON \"existencias\" (\"codprd\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_existencias_codbod ON \"existencias\" (\"codbod\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_movcxc_id_fac ON \"movcxc\" (\"id_fac\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_movcxc_codcli ON \"movcxc\" (\"codcli\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_productos_codprd ON \"productos\" (\"codprd\");\n");
        fwrite($handle, "CREATE INDEX IF NOT EXISTS idx_clientes_codcli ON \"clientes\" (\"codcli\");\n\n");

        fclose($handle);

        $fileSizeMb = round(filesize($filePath) / (1024 * 1024), 2);
        $this->info("✅ Exportación finalizada con éxito.");
        $this->info("📁 Archivo generado: {$filePath} ({$fileSizeMb} MB)");
        $this->info("Listo para importar directamente en el SQL Editor de Supabase o mediante psql.");

        return Command::SUCCESS;
    }
}
