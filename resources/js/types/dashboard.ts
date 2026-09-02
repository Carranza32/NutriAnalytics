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
    category_id: number;
    category_name: string;
    revenue: number;
    units_sold: number;
    percentage: number;
}

export interface TopProductItem {
    product_id: number;
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
    order_id: number;
    customer_id: string;
    order_date: string;
    ship_country: string;
    items_count: number;
    total_amount: number;
}

export interface LowStockItem {
    product_id: number;
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

export interface DashboardProps {
    period: string;
    available_periods: PeriodOption[];
    kpis: DashboardKpis;
    sales_trend: MonthlySalesPoint[];
    category_distribution: CategoryDistributionItem[];
    top_products: TopProductItem[];
    geo_distribution: CountrySalesItem[];
    recent_orders: RecentOrderItem[];
    low_stock_alerts: LowStockItem[];
}
