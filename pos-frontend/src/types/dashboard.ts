export interface DashboardKpis {
  daily_sales: number;
  monthly_sales: number;
  total_orders: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  sold_quantity: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface RecentTransaction {
  id: number;
  order_number: string;
  total_amount: number;
  ordered_at: string;
  cashier?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
}

export interface DashboardPayload {
  kpis: DashboardKpis;
  top_products: TopProduct[];
  revenue_trend: RevenuePoint[];
  recent_transactions: RecentTransaction[];
}
