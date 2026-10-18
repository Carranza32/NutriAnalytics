<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class SyncToSupabase extends Command
{
    protected $signature = 'db:sync-supabase
                            {--host= : Host de PostgreSQL / Supabase}
                            {--port=5432 : Puerto de conexión}
                            {--database= : Nombre de la base de datos}
                            {--username= : Usuario de PostgreSQL}
                            {--password= : Contraseña de PostgreSQL}';

    protected $description = 'Sincroniza automáticamente los datos de GeoSoft ERP (SQL Server) hacia Supabase (PostgreSQL)';

    public function handle(): int
    {
        $this->info('🚀 Iniciando sincronización de GeoSoft ERP hacia Supabase...');

        $host = $this->option('host') ?: env('SUPABASE_DB_HOST', env('DB_HOST'));
        $port = $this->option('port') ?: env('SUPABASE_DB_PORT', env('DB_PORT', '5432'));
        $database = $this->option('database') ?: env('SUPABASE_DB_DATABASE', env('DB_DATABASE', 'postgres'));
        $username = $this->option('username') ?: env('SUPABASE_DB_USERNAME', env('DB_USERNAME', 'postgres'));
        $password = $this->option('password') ?: env('SUPABASE_DB_PASSWORD', env('DB_PASSWORD'));

        if (! $host || ! $password) {
            $this->error('Debes proporcionar las credenciales de Supabase en .env (SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD) o mediante opciones.');
            return Command::FAILURE;
        }

        $this->info("Conectando a Supabase en {$host}:{$port}/{$database}...");

        try {
            $dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode=require";
            $pgPdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $this->info('✅ Conexión establecida con Supabase.');
        } catch (\Throwable $e) {
            $this->error('Error al conectar con Supabase: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $tables = [
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

        // Verificar si las tablas ya existen en Supabase; si no existen, aplicar el esquema automáticamente
        $checkStmt = $pgPdo->query("SELECT to_regclass('public.sucursales')");
        $tableExists = $checkStmt->fetchColumn();

        if (! $tableExists) {
            $this->warn('Las tablas no existen en Supabase. Aplicando esquema DDL e índices iniciales...');
            $schemaFile = database_path('geopost_pyme_schema.sql');
            if (file_exists($schemaFile)) {
                $pgPdo->exec(file_get_contents($schemaFile));
                $this->info('✅ Esquema e índices creados con éxito en Supabase.');
            } else {
                $this->error("No se encontró el archivo de esquema: {$schemaFile}");
                return Command::FAILURE;
            }
        }

        $startTime = microtime(true);

        foreach ($tables as $targetTable => $sourceTable) {
            $this->info("Sincronizando: {$sourceTable} -> {$targetTable}...");

            $columns = DB::select("
                SELECT COLUMN_NAME, DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            ", [$sourceTable]);

            if (empty($columns)) continue;

            $colNames = array_map(fn($c) => strtolower(trim($c->COLUMN_NAME)), $columns);
            $quotedCols = implode(', ', array_map(fn($c) => "\"{$c}\"", $colNames));

            // Truncar tabla destino
            $pgPdo->exec("TRUNCATE TABLE \"{$targetTable}\" CASCADE;");

            $total = DB::table($sourceTable)->count();
            $this->output->progressStart($total);

            // Calcular tamaño de chunk seguro (PostgreSQL soporta máx 65535 parámetros por query)
            $colCount = count($columns);
            $chunkSize = max(50, min(1000, (int) floor(50000 / $colCount)));

            DB::table($sourceTable)->orderBy(DB::raw('1'))->chunk($chunkSize, function ($rows) use ($pgPdo, $targetTable, $quotedCols, $columns) {
                if ($rows->isEmpty()) return;

                $placeholders = [];
                $params = [];

                foreach ($rows as $row) {
                    $rowArray = (array) $row;
                    $rowPlaceholders = [];

                    foreach ($columns as $col) {
                        $origCol = $col->COLUMN_NAME;
                        $val = $rowArray[$origCol] ?? null;

                        if (strtolower($col->DATA_TYPE) === 'bit' && $val !== null) {
                            $val = ((string) $val === '1' || $val === true || $val === 1) ? 't' : 'f';
                        } elseif (is_string($val)) {
                            $val = trim($val);
                        }

                        $rowPlaceholders[] = '?';
                        $params[] = $val;
                    }
                    $placeholders[] = '(' . implode(', ', $rowPlaceholders) . ')';
                }

                $sql = "INSERT INTO \"{$targetTable}\" ({$quotedCols}) VALUES " . implode(', ', $placeholders);
                $stmt = $pgPdo->prepare($sql);
                $stmt->execute($params);

                $this->output->progressAdvance(count($rows));
            });

            $this->output->progressFinish();
        }

        $duration = round(microtime(true) - $startTime, 1);
        $this->info("🎉 Sincronización completa con Supabase en {$duration} segundos.");

        return Command::SUCCESS;
    }
}
