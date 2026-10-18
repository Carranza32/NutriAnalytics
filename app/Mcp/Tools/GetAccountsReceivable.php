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

#[Description('Auditoría de Cuentas por Cobrar (CxC), mora de clientes y cartera crediticia: consulta de saldos pendientes, facturas vencidas por tramos (1-30, 31-60, 61-90, >90 días) y clientes en riesgo financiero.')]
#[IsReadOnly]
class GetAccountsReceivable extends Tool
{
    protected string $name = 'get_accounts_receivable';

    protected string $title = 'Obtener Cuentas por Cobrar y Mora';

    public function schema(JsonSchema $schema): array
    {
        return [
            'min_dias_mora' => $schema->integer()
                ->min(0)
                ->max(365)
                ->description('Mínimo de días de vencimiento/mora para filtrar (ej. 30 para mora mayor a un mes, 60 o 0 para ver toda la cartera).'),
            'nombre_o_codigo_cliente' => $schema->string()
                ->description('Término opcional de búsqueda para consultar la deuda de un cliente específico por código o nombre.'),
            'sucursal' => $schema->string()
                ->description('Código opcional de sucursal ("001", "003", o "all").'),
            'limit' => $schema->integer()
                ->min(1)
                ->max(50)
                ->description('Límite de clientes deudores a listar (por defecto 15).'),
        ];
    }

    public function handle(Request $request): ResponseFactory|Response
    {
        $validated = $request->validate([
            'min_dias_mora' => ['nullable', 'integer', 'min:0', 'max:365'],
            'nombre_o_codigo_cliente' => ['nullable', 'string', 'max:100'],
            'sucursal' => ['nullable', 'string', 'max:10'],
            'limit' => ['nullable', 'integer', 'between:1,50'],
        ]);

        $minDiasMora = (int) ($validated['min_dias_mora'] ?? 0);
        $clientSearch = trim((string) ($validated['nombre_o_codigo_cliente'] ?? ''));
        $sucursal = ! empty($validated['sucursal']) && $validated['sucursal'] !== 'all' ? trim((string) $validated['sucursal']) : null;
        $limit = (int) ($validated['limit'] ?? 15);

        $sucursalCondition = '';
        if ($sucursal) {
            $safeSucursal = addslashes($sucursal);
            $sucursalCondition = "AND RTRIM(e.codsuc) = '{$safeSucursal}'";
        }

        // Tramos de antigüedad (Aging)
        $agingRows = DB::select("
            WITH Cartera AS (
                SELECT 
                    e.ID_Fac,
                    DATEDIFF(day, e.fecven, CAST('2026-10-13' AS date)) as dias_mora,
                    ROUND(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - ISNULL(p.total_pagado, 0), 2) as saldo
                FROM encfct e
                LEFT JOIN (
                    SELECT id_fac, SUM(CAST(valmov as float)) as total_pagado
                    FROM movcxc
                    GROUP BY id_fac
                ) p ON e.ID_Fac = p.id_fac
                WHERE e.estado != 'A' AND e.condpgo = 'CRD' {$sucursalCondition}
                AND (CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - ISNULL(p.total_pagado, 0)) > 0.05
            )
            SELECT 
                CASE 
                    WHEN dias_mora <= 0 THEN 'Corriente / Al Día'
                    WHEN dias_mora BETWEEN 1 AND 30 THEN '1 - 30 días'
                    WHEN dias_mora BETWEEN 31 AND 60 THEN '31 - 60 días'
                    WHEN dias_mora BETWEEN 61 AND 90 THEN '61 - 90 días'
                    ELSE 'Más de 90 días'
                END as tramo,
                COUNT(*) as facturas,
                ROUND(SUM(saldo), 2) as total_saldo
            FROM Cartera
            GROUP BY 
                CASE 
                    WHEN dias_mora <= 0 THEN 'Corriente / Al Día'
                    WHEN dias_mora BETWEEN 1 AND 30 THEN '1 - 30 días'
                    WHEN dias_mora BETWEEN 31 AND 60 THEN '31 - 60 días'
                    WHEN dias_mora BETWEEN 61 AND 90 THEN '61 - 90 días'
                    ELSE 'Más de 90 días'
                END
        ");

        $totalCartera = 0.0;
        $tramosMap = [
            'Corriente / Al Día' => 0.0,
            '1 - 30 días' => 0.0,
            '31 - 60 días' => 0.0,
            '61 - 90 días' => 0.0,
            'Más de 90 días' => 0.0,
        ];
        foreach ($agingRows as $r) {
            $s = (float) $r->total_saldo;
            $t = trim($r->tramo);
            if (isset($tramosMap[$t])) {
                $tramosMap[$t] = $s;
            }
            $totalCartera += $s;
        }

        $saldoVencido = round($totalCartera - $tramosMap['Corriente / Al Día'], 2);
        $tasaMorosidad = $totalCartera > 0 ? round(($saldoVencido / $totalCartera) * 100, 1) : 0;

        // Clientes Deudores
        $clientFilter = '';
        if ($clientSearch !== '') {
            $safeSearch = addslashes($clientSearch);
            $clientFilter = "AND (RTRIM(e.codcli) LIKE '%{$safeSearch}%' OR RTRIM(COALESCE(e.shipto, c.nomcli)) LIKE '%{$safeSearch}%')";
        }

        $debtorRows = DB::select("
            WITH Cartera AS (
                SELECT 
                    e.ID_Fac,
                    RTRIM(e.codcli) as codcli,
                    RTRIM(COALESCE(e.shipto, c.nomcli)) as nomcli,
                    RTRIM(COALESCE(v.nomven, e.codven, 'OFICINA')) as nomven,
                    DATEDIFF(day, e.fecven, CAST('2026-10-13' AS date)) as dias_mora,
                    ROUND(CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - ISNULL(p.total_pagado, 0), 2) as saldo
                FROM encfct e
                LEFT JOIN clientes c ON RTRIM(e.codcli) = RTRIM(c.codcli)
                LEFT JOIN vendedores v ON RTRIM(e.codven) = RTRIM(v.codven)
                LEFT JOIN (
                    SELECT id_fac, SUM(CAST(valmov as float)) as total_pagado
                    FROM movcxc
                    GROUP BY id_fac
                ) p ON e.ID_Fac = p.id_fac
                WHERE e.estado != 'A' AND e.condpgo = 'CRD' {$sucursalCondition} {$clientFilter}
                AND (CAST(e.valgrv as float) + CAST(e.valexe as float) + CAST(e.iva as float) - ISNULL(p.total_pagado, 0)) > 0.05
            )
            SELECT 
                codcli,
                nomcli,
                nomven,
                COUNT(DISTINCT ID_Fac) as facturas_pendientes,
                MAX(dias_mora) as max_dias_mora,
                ROUND(SUM(saldo), 2) as saldo_total
            FROM Cartera
            GROUP BY codcli, nomcli, nomven
            HAVING MAX(dias_mora) >= {$minDiasMora}
            ORDER BY saldo_total DESC
        ");

        $debtors = array_slice($debtorRows, 0, $limit);
        $debtorsFormatted = array_map(function ($d) {
            $maxMora = (int) $d->max_dias_mora;
            $risk = 'Bajo';
            if ($maxMora > 90) {
                $risk = 'Crítico (>90d)';
            } elseif ($maxMora > 60) {
                $risk = 'Alto (>60d)';
            } elseif ($maxMora > 30) {
                $risk = 'Medio (>30d)';
            } elseif ($maxMora > 0) {
                $risk = 'Alerta Temprana';
            }

            return [
                'codigo_cliente' => $d->codcli,
                'nombre_cliente' => $d->nomcli,
                'asesor_comercial' => $d->nomven,
                'facturas_pendientes' => (int) $d->facturas_pendientes,
                'dias_maximos_mora' => $maxMora,
                'saldo_pendiente_dolares' => (float) $d->saldo_total,
                'saldo_formateado' => '$' . number_format((float) $d->saldo_total, 2),
                'nivel_riesgo' => $risk,
            ];
        }, $debtors);

        return Response::structured([
            'success' => true,
            'resumen_cartera' => [
                'total_cartera_dolares' => '$' . number_format($totalCartera, 2),
                'saldo_al_dia' => '$' . number_format($tramosMap['Corriente / Al Día'], 2),
                'saldo_vencido_total' => '$' . number_format($saldoVencido, 2),
                'tasa_morosidad' => $tasaMorosidad . '%',
            ],
            'tramos_envejecimiento' => [
                'al_dia' => '$' . number_format($tramosMap['Corriente / Al Día'], 2),
                'mora_1_a_30_dias' => '$' . number_format($tramosMap['1 - 30 días'], 2),
                'mora_31_a_60_dias' => '$' . number_format($tramosMap['31 - 60 días'], 2),
                'mora_61_a_90_dias' => '$' . number_format($tramosMap['61 - 90 días'], 2),
                'mora_mas_de_90_dias' => '$' . number_format($tramosMap['Más de 90 días'], 2),
            ],
            'total_deudores_listados' => count($debtorsFormatted),
            'deudores' => $debtorsFormatted,
        ]);
    }
}
