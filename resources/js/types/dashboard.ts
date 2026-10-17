export interface DashboardKpis {
    total_revenue: number;
    total_orders: number;
    total_units_sold: number;
    average_order_value: number;
    low_stock_count: number;
    active_products_count: number;
}

export interface MonthlySalesPoint {
    month: string;
    label: string;
    revenue: number;
    orders_count: number;
    units_sold: number;
}

export interface CategoryDistributionItem {
    category_id: string | number;
    category_name: string;
    revenue: number;
    units_sold: number;
    percentage: number;
}

export interface TopProductItem {
    product_id: string | number;
    product_name: string;
    category_name: string;
    revenue: number;
    units_sold: number;
    units_in_stock: number;
}

export interface CountrySalesItem {
    country: string;
    revenue: number;
    orders_count: number;
}

export interface RecentOrderItem {
    order_id: string | number;
    customer_id: string;
    order_date: string;
    ship_country: string;
    items_count: number;
    total_amount: number;
}

export interface LowStockItem {
    product_id: string | number;
    product_name: string;
    category_name: string;
    units_in_stock: number;
    reorder_level: number;
    units_on_order: number;
    is_out_of_stock: boolean;
}

export interface PeriodOption {
    id: string;
    label: string;
}

// Interfaces para Comparativa Interanual (YoY)
export interface YoYMonthlyPoint {
    mes_num: number;
    mes_nombre: string;
    venta_2025: number;
    venta_2026: number;
    facturas_2025: number;
    facturas_2026: number;
    diff_monto: number;
    diff_pct: number;
    has_data_2026: boolean;
}

export interface YoYSummary {
    ytd_2026_revenue: number;
    ytd_2025_revenue: number;
    diff_amount: number;
    diff_pct: number;
    ytd_2026_invoices: number;
    ytd_2025_invoices: number;
    invoices_growth_pct: number;
}

export interface YoYComparison {
    summary: YoYSummary;
    monthly: YoYMonthlyPoint[];
}

// Interfaces para Matriz de Clientes y Cobranza (CxC)
export interface AgingItem {
    tramo: string;
    saldo: number;
    facturas: number;
    porcentaje: number;
    color: string;
}

export interface DebtorClientItem {
    codcli: string;
    nomcli: string;
    nomven: string;
    facturas_pendientes: number;
    max_dias_mora: number;
    saldo_total: number;
    risk_level: string;
}

export interface TopClientMatrixItem {
    codcli: string;
    nomcli: string;
    nomven: string;
    ultima_compra: string;
    dias_sin_comprar: number;
    total_facturas: number;
    compras_totales: number;
    saldo_deuda: number;
    status_segment: string;
}

export interface ChurnRiskClientItem {
    codcli: string;
    nomcli: string;
    nomven: string;
    ultima_compra: string;
    dias_sin_comprar: number;
    compras_totales: number;
    facturas_total: number;
}

export interface CxCKpis {
    total_portfolio: number;
    current_portfolio: number;
    overdue_portfolio: number;
    overdue_plus_90: number;
    overdue_rate: number;
    total_pending_invoices: number;
}

export interface AccountsReceivableMatrix {
    kpis: CxCKpis;
    aging_distribution: AgingItem[];
    top_debtors: DebtorClientItem[];
    top_clients: TopClientMatrixItem[];
    churn_risk_clients: ChurnRiskClientItem[];
}

// Interfaces para Semáforo de Abastecimiento & Cobertura de Stock
export interface SupplyItem {
    codprd: string;
    producto: string;
    marca: string;
    unibas: string;
    stock_actual: number;
    consumo_mensual: number;
    dias_cobertura: number;
    venta_6m: number;
    estado: 'critico' | 'alerta' | 'optimo' | 'exceso';
    badge: string;
    accion: string;
    sugerencia_compra: number;
}

export interface PredictiveAlertItem {
    tipo: 'quiebre' | 'reorden';
    producto: string;
    marca: string;
    mensaje: string;
    dias_restantes: number;
    sugerencia: string;
    nivel: 'urgente' | 'alerta';
}

export interface SupplyKpis {
    total_criticos: number;
    venta_en_juego_critica: number;
    total_alerta: number;
    venta_en_juego_alerta: number;
    total_optimo: number;
    total_exceso: number;
}

export interface SupplyChainTrafficLight {
    kpis: SupplyKpis;
    predictive_alerts: PredictiveAlertItem[];
    items: SupplyItem[];
}

export interface SucursalOption {
    id: string;
    name: string;
}

export interface DashboardProps {
    period: string;
    available_periods: PeriodOption[];
    sucursal: string;
    available_sucursales: SucursalOption[];
    kpis: DashboardKpis;
    sales_trend: MonthlySalesPoint[];
    category_distribution: CategoryDistributionItem[];
    top_products: TopProductItem[];
    geo_distribution: CountrySalesItem[];
    recent_orders: RecentOrderItem[];
    low_stock_alerts: LowStockItem[];
    yoy_comparison: YoYComparison;
    cxc_matrix: AccountsReceivableMatrix;
    supply_chain: SupplyChainTrafficLight;
    last_updated?: string;
    is_cached?: boolean;
}
