"use client";

import { useEffect, useMemo, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Payment {
  id: number;
  method: "cash" | "card";
  amount: number;
  status: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  ordered_at: string;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  cashier?: { id: number; name: string; role?: string } | null;
  items?: OrderItem[];
  payments?: Payment[];
}

interface OrdersResponse {
  data: Order[];
}

function formatCurrency(value: number) {
  return `AED ${Number(value).toFixed(2)}`;
}

function defaultDateRange() {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 7);

  const toIso = (date: Date) => date.toISOString().slice(0, 10);

  return {
    from: toIso(past),
    to: toIso(today),
  };
}

export default function OrdersPage() {
  const defaults = useMemo(() => defaultDateRange(), []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get<OrdersResponse>("/orders");
        setOrders(response.data.data);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to load orders."));
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`).getTime();
    const to = new Date(`${toDate}T23:59:59`).getTime();

    return orders.filter((order) => {
      const orderedAt = new Date(order.ordered_at).getTime();
      return orderedAt >= from && orderedAt <= to;
    });
  }, [fromDate, orders, toDate]);

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalVat = filteredOrders.reduce((sum, order) => sum + Number(order.vat_amount), 0);

    return { totalOrders, totalRevenue, totalVat };
  }, [filteredOrders]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Orders</h2>
        <p className="text-sm text-slate-400">Track and review completed POS transactions.</p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 md:col-span-1">
            <div className="rounded-md border border-slate-700 bg-slate-950 p-2">
              <p className="text-xs text-slate-400">Orders</p>
              <p className="text-sm font-semibold text-slate-100">{summary.totalOrders}</p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-950 p-2">
              <p className="text-xs text-slate-400">Revenue</p>
              <p className="text-sm font-semibold text-slate-100">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-950 p-2">
              <p className="text-xs text-slate-400">VAT</p>
              <p className="text-sm font-semibold text-slate-100">{formatCurrency(summary.totalVat)}</p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Order List</h3>

        {isLoading ? (
          <p className="text-sm text-slate-400">Loading orders...</p>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => {
              const expanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className="rounded-md border border-slate-700 bg-slate-950 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{order.order_number}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.ordered_at).toLocaleString()} | Cashier:{" "}
                        {order.cashier?.name ?? "-"} | Customer: {"Walk-in"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-slate-100">
                        {formatCurrency(Number(order.total_amount))}
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        {expanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="mt-3 grid gap-3 border-t border-slate-800 pt-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Items</p>
                        <div className="space-y-1">
                          {order.items?.map((item) => (
                            <p key={item.id} className="text-sm text-slate-200">
                              {item.product_name} ({item.product_sku}) x {item.quantity} ={" "}
                              {formatCurrency(item.line_total)}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Payments</p>
                        <div className="space-y-1">
                          {order.payments?.map((payment) => (
                            <p key={payment.id} className="text-sm text-slate-200">
                              {payment.method.toUpperCase()} - {formatCurrency(payment.amount)} (
                              {payment.status})
                            </p>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-slate-300">
                          <p>Subtotal: {formatCurrency(order.subtotal)}</p>
                          <p>Discount: {formatCurrency(order.discount_amount)}</p>
                          <p>VAT: {formatCurrency(order.vat_amount)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!filteredOrders.length && (
              <p className="text-sm text-slate-400">No orders found for selected range.</p>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
