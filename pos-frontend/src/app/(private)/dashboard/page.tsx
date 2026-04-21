"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Tooltip} from "chart.js";
import { Line } from "react-chartjs-2";
import { api } from "@/lib/api";
import type { DashboardPayload } from "@/types/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface DashboardResponse {
  data: DashboardPayload;
}

function formatCurrency(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      setErrorMessage("");
      setIsLoading(true);

      try {
        const response = await api.get<DashboardResponse>("/dashboard");
        setDashboard(response.data.data);
      } catch {
        setErrorMessage("Unable to load dashboard analytics.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const chartData = useMemo(() => {
    const labels = dashboard?.revenue_trend.map((point) => point.date) ?? [];
    const values = dashboard?.revenue_trend.map((point) => Number(point.revenue)) ?? [];

    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: values,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [dashboard]);

  const menuItems = [
    { href: "/pos", label: "POS Billing", helper: "Create and complete orders", icon: "$" },
    { href: "/products", label: "Products", helper: "Manage catalog and inventory", icon: "#" },
    { href: "/orders", label: "Orders", helper: "Review transaction history", icon: "=" },
    { href: "/reports", label: "Reports", helper: "Sales summary and exports", icon: "*" },
  ];

  if (isLoading) {
    return <p className="text-sm text-slate-400">Loading dashboard...</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-red-400">{errorMessage}</p>;
  }

  if (!dashboard) {
    return <p className="text-sm text-slate-400">No dashboard data available.</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">POS Main Menu</h2>
        <p className="text-sm text-slate-400">Quick actions for cashier and management workflow</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-slate-700 bg-linear-to-br from-slate-900 to-slate-800 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-lg text-blue-300">
              {item.icon}
            </div>
            <p className="text-xl font-bold text-slate-100">{item.label}</p>
            <p className="mt-1 text-sm text-slate-400">{item.helper}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-300 opacity-0 transition group-hover:opacity-100">
              Open Module
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <p className="text-sm text-slate-400">Daily Sales</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {formatCurrency(Number(dashboard.kpis.daily_sales))}
          </p>
        </article>
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <p className="text-sm text-slate-400">Monthly Sales</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {formatCurrency(Number(dashboard.kpis.monthly_sales))}
          </p>
        </article>
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <p className="text-sm text-slate-400">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {dashboard.kpis.total_orders}
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Revenue Trend (7 days)</h3>
          <Line data={chartData} />
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Top Products</h3>
          <div className="space-y-2">
            {dashboard.top_products.map((product) => (
              <div
                key={product.product_id}
                className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-100">{product.product_name}</p>
                <p className="text-xs text-slate-400">Sold: {product.sold_quantity}</p>
              </div>
            ))}
            {!dashboard.top_products.length && (
              <p className="text-sm text-slate-400">No sales yet.</p>
            )}
          </div>
        </article>
      </div>

      <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-700 text-slate-400">
              <tr>
                <th className="px-2 py-2 font-medium">Order #</th>
                <th className="px-2 py-2 font-medium">Cashier</th>
                <th className="px-2 py-2 font-medium">Customer</th>
                <th className="px-2 py-2 font-medium">Total</th>
                <th className="px-2 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recent_transactions.map((order) => (
                <tr key={order.id} className="border-b border-slate-800">
                  <td className="px-2 py-2 text-slate-100">{order.order_number}</td>
                  <td className="px-2 py-2 text-slate-300">{order.cashier?.name ?? "-"}</td>
                  <td className="px-2 py-2 text-slate-300">{"Walk-in"}</td>
                  <td className="px-2 py-2 text-slate-300">
                    {formatCurrency(Number(order.total_amount))}
                  </td>
                  <td className="px-2 py-2 text-slate-300">
                    {new Date(order.ordered_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
