<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Resumen Ejecutivo - NutriFertil Hub</title>
    <style>
        @page {
            margin: 22px 28px;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            font-size: 10px;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #1E5E3A;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .header table {
            width: 100%;
        }
        .logo-title {
            font-size: 16px;
            font-weight: 700;
            color: #1E5E3A;
            letter-spacing: -0.3px;
        }
        .logo-subtitle {
            font-size: 9px;
            color: #666;
            margin-top: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .meta-info {
            text-align: right;
            font-size: 9px;
            color: #555;
        }
        .meta-pill {
            display: inline-block;
            background: #E8F5E9;
            color: #1E5E3A;
            font-weight: bold;
            padding: 3px 8px;
            border-radius: 4px;
            margin-bottom: 3px;
        }

        /* KPI Cards Grid */
        .kpi-table {
            width: 100%;
            margin-bottom: 14px;
            border-spacing: 6px 0;
        }
        .kpi-card {
            background: #F8F9FA;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: left;
        }
        .kpi-label {
            font-size: 8px;
            font-weight: 600;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .kpi-value {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            margin-top: 2px;
        }
        .kpi-sub {
            font-size: 8px;
            color: #059669;
            margin-top: 2px;
            font-weight: 500;
        }

        /* Section Titles */
        .section-header {
            font-size: 11px;
            font-weight: 700;
            color: #1E5E3A;
            border-bottom: 1px solid #D1D5DB;
            padding-bottom: 4px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        /* Two columns layout */
        .columns-table {
            width: 100%;
            border-spacing: 10px 0;
            margin-bottom: 12px;
        }
        .col {
            vertical-align: top;
            width: 50%;
        }

        /* Tables */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        table.data-table th {
            background-color: #F3F4F6;
            color: #374151;
            font-weight: 700;
            text-align: left;
            padding: 5px 6px;
            border-bottom: 1px solid #D1D5DB;
            text-transform: uppercase;
            font-size: 7.5px;
        }
        table.data-table td {
            padding: 4.5px 6px;
            border-bottom: 1px solid #F3F4F6;
            color: #1F2937;
        }
        table.data-table tr:nth-child(even) td {
            background-color: #FAFAFA;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .font-bold {
            font-weight: 700;
        }

        /* Footer */
        .footer {
            margin-top: 14px;
            border-top: 1px solid #E5E7EB;
            padding-top: 6px;
            font-size: 7.5px;
            color: #9CA3AF;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- Header Corporativo -->
    <div class="header">
        <table>
            <tr>
                <td>
                    <div class="logo-title">NUTRIFERTIL HUB</div>
                    <div class="logo-subtitle">Informe Ejecutivo de Desempeño Comercial • GeoSoft ERP</div>
                </td>
                <td class="meta-info">
                    <div class="meta-pill">Período: {{ $filters['date_from'] }} al {{ $filters['date_to'] }}</div>
                    <div>Emisión: {{ $generatedAt }}</div>
                    @if($filters['vendedor'])
                        <div>Vendedor: <strong>{{ $filters['vendedor'] }}</strong></div>
                    @endif
                    @if($filters['marca'])
                        <div>Marca: <strong>{{ $filters['marca'] }}</strong></div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- KPI Cards (Fila Superior) -->
    <table class="kpi-table">
        <tr>
            <td class="kpi-card" style="border-left: 3px solid #10B981;">
                <div class="kpi-label">Facturación Neta</div>
                <div class="kpi-value">${{ number_format($kpis['total_revenue'], 2) }}</div>
                <div class="kpi-sub">Comprobantes válidos</div>
            </td>
            <td class="kpi-card" style="border-left: 3px solid #3B82F6;">
                <div class="kpi-label">Facturas Emitidas</div>
                <div class="kpi-value">{{ number_format($kpis['total_invoices']) }}</div>
                <div class="kpi-sub">En período seleccionado</div>
            </td>
            <td class="kpi-card" style="border-left: 3px solid #6366F1;">
                <div class="kpi-label">Unidades Vendidas</div>
                <div class="kpi-value">{{ number_format($kpis['total_units']) }}</div>
                <div class="kpi-sub">Volumen de despacho</div>
            </td>
            <td class="kpi-card" style="border-left: 3px solid #F59E0B;">
                <div class="kpi-label">Ticket Promedio</div>
                <div class="kpi-value">${{ number_format($kpis['average_ticket'], 2) }}</div>
                <div class="kpi-sub">{{ number_format($kpis['total_clients']) }} clientes atendidos</div>
            </td>
        </tr>
    </table>

    <!-- Dos Columnas: Top Vendedores vs Top Marcas -->
    <table class="columns-table">
        <tr>
            <!-- Columna 1: Rendimiento por Vendedor -->
            <td class="col">
                <div class="section-header">Rendimiento por Vendedor (Top)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Vendedor</th>
                            <th class="text-center">Fact.</th>
                            <th class="text-right">Total ($)</th>
                            <th class="text-right">Ticket</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($topSellers as $seller)
                            <tr>
                                <td class="font-bold">{{ $seller['vendedor'] }}</td>
                                <td class="text-center">{{ $seller['total_facturas'] }}</td>
                                <td class="text-right font-bold">${{ number_format($seller['total_facturado'], 2) }}</td>
                                <td class="text-right">${{ number_format($seller['ticket_promedio'], 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>

            <!-- Columna 2: Distribución por Marca / Rubro -->
            <td class="col">
                <div class="section-header">Distribución por Marca / Rubro</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Marca / Línea</th>
                            <th class="text-center">Prd</th>
                            <th class="text-right">Unid.</th>
                            <th class="text-right">Total ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($topBrands as $brand)
                            <tr>
                                <td class="font-bold">{{ $brand['marca'] }}</td>
                                <td class="text-center">{{ $brand['productos_vendidos'] }}</td>
                                <td class="text-right">{{ number_format($brand['unidades']) }}</td>
                                <td class="text-right font-bold">${{ number_format($brand['total_facturado'], 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <!-- Transacciones Recientes / Muestra Representativa -->
    <div class="section-header">Muestra de Facturación Reciente</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Producto</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach(array_slice($recentSales, 0, 8) as $sale)
                <tr>
                    <td class="font-bold">{{ $sale['numfct'] }}</td>
                    <td>{{ $sale['fecfct'] }}</td>
                    <td>{{ Str::limit($sale['cliente'], 28) }}</td>
                    <td>{{ $sale['vendedor'] }}</td>
                    <td>{{ Str::limit($sale['producto'], 32) }}</td>
                    <td class="text-right">{{ number_format($sale['cantidad'], 2) }}</td>
                    <td class="text-right font-bold">${{ number_format($sale['subtotal'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
        Documento confidencial para uso exclusivo del Consejo Directivo y Gerencia General • Generado por NutriAnalytics Intelligence Suite
    </div>

</body>
</html>
