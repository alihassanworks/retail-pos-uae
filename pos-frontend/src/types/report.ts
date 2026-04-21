export interface SalesReportSummary {
  from: string;
  to: string;
  total_orders: number;
  subtotal: number;
  discount_total: number;
  vat_total: number;
  grand_total: number;
}

export interface SalesReportOrder {
  id: number;
  order_number: string;
  ordered_at: string;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  cashier?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
}

export interface SalesReportPayload {
  summary: SalesReportSummary;
  orders: SalesReportOrder[];
}
