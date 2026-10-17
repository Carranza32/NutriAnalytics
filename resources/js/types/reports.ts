export interface FilterOption {
    id: string;
    name: string;
}

export interface ReportFilterOptions {
    vendedores: FilterOption[];
    marcas: FilterOption[];
    sucursales: FilterOption[];
    tipos: FilterOption[];
}

export interface ReportFilters {
    date_from: string;
    date_to: string;
    vendedor: string | null;
    marca: string | null;
    sucursal: string | null;
    tipo: 'ventas_detalle' | 'por_vendedor' | 'por_marca' | 'por_sucursal';
    search: string | null;
}

export interface ReportKpis {
    total_revenue: number;
    total_invoices: number;
    total_units: number;
    total_clients: number;
    average_ticket: number;
}

export interface DetailedSaleRecord {
    numfct: string;
    fecfct: string;
    cliente: string;
    vendedor: string;
    sucursal: string;
    codprd: string;
    producto: string;
    marca: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

export interface SellerRecord {
    vendedor: string;
    total_facturas: number;
    total_clientes: number;
    unidades: number;
    total_facturado: number;
    ticket_promedio: number;
}

export interface BrandRecord {
    marca: string;
    productos_vendidos: number;
    unidades: number;
    total_facturado: number;
}

export interface BranchRecord {
    sucursal: string;
    total_facturas: number;
    unidades: number;
    total_facturado: number;
}

export type ReportRecord = DetailedSaleRecord | SellerRecord | BrandRecord | BranchRecord | Record<string, any>;

export interface ReportPageProps {
    filters: ReportFilters;
    filter_options: ReportFilterOptions;
    kpis: ReportKpis;
    records: ReportRecord[];
    total_count: number;
}
