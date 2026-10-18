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

#[Description('Describe el esquema, tablas y columnas disponibles en la base de datos GeoSoft ERP (SQL Server). Útil para conocer qué campos y tablas existen antes de armar una consulta SQL personalizada.')]
#[IsReadOnly]
class GetTableSchema extends Tool
{
    protected string $name = 'get_table_schema';

    protected string $title = 'Obtener Esquema de Tablas';

    public function schema(JsonSchema $schema): array
    {
        return [
            'table_name' => $schema->string()
                ->description('Nombre opcional de la tabla a inspeccionar (ej. "Encfct", "detfct", "productos", "clientes", "Existencias", "movcxc", "vendedores", "sucursales", "rubros"). Si se omite, retorna la lista de tablas del ERP.'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'table_name' => ['nullable', 'string', 'max:50'],
        ]);

        $tableName = trim((string) ($validated['table_name'] ?? ''));

        // Si no se especifica tabla, retornar el mapa principal del ERP
        if ($tableName === '') {
            return Response::structured([
                'success' => true,
                'tablas_principales' => [
                    ['tabla' => 'Encfct', 'descripcion' => 'Encabezados de facturas y créditos fiscales (fechas, sucursal, vendedor, cliente, montos gravados/exentos, estado).'],
                    ['tabla' => 'detfct', 'descripcion' => 'Renglones y detalles de facturación (códigos de producto, cantidades vendidas, precios de venta, costos).'],
                    ['tabla' => 'productos', 'descripcion' => 'Catálogo maestro de fertilizantes e insumos agrícolas (código, nombre, precios A/B/C/D, costos, rubro).'],
                    ['tabla' => 'Existencias', 'descripcion' => 'Stock e inventario por bodega (codprd, codbod, Exiprd).'],
                    ['tabla' => 'movcxc', 'descripcion' => 'Movimientos de cuentas por cobrar, pagos y abonos de clientes.'],
                    ['tabla' => 'clientes', 'descripcion' => 'Maestro de clientes (código, nombre, contacto, NIT, NRC, giro, límite crédito, días crédito).'],
                    ['tabla' => 'vendedores', 'descripcion' => 'Asesores comerciales y vendedores (código, nombre, comisión).'],
                    ['tabla' => 'sucursales', 'descripcion' => 'Sucursales de la empresa (001 Casa Matriz, 003 Masferrer, etc.).'],
                    ['tabla' => 'rubros', 'descripcion' => 'Marcas y rubros comerciales de los insumos (codrub, nomrub).'],
                ],
                'instruccion' => 'Para ver las columnas y tipos de datos de una tabla específica, vuelve a llamar a esta herramienta indicando el parámetro "table_name".',
            ]);
        }

        // Inspeccionar columnas de la tabla indicada
        $columns = DB::select("
            SELECT 
                COLUMN_NAME as columna,
                DATA_TYPE as tipo_dato,
                CHARACTER_MAXIMUM_LENGTH as longitud,
                IS_NULLABLE as permite_nulo
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        ", [$tableName]);

        if (empty($columns)) {
            return Response::structured([
                'success' => false,
                'error' => "La tabla '{$tableName}' no existe o no tiene columnas accesibles.",
            ]);
        }

        return Response::structured([
            'success' => true,
            'tabla' => $tableName,
            'total_columnas' => count($columns),
            'columnas' => $columns,
        ]);
    }
}
