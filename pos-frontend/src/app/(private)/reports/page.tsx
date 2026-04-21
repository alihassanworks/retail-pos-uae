"use client";

import { useMemo, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import type { SalesReportPayload } from "@/types/report";

interface SalesReportResponse {
  data: SalesReportPayload;
}

function formatCurrency(value: number) {
  return `AED ${Number(value).toFixed(2)}`;
}

function defaultDateRange() {
  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - 6);

  const toIso = (value: Date) => value.toISOString().slice(0, 10);

  return {
    from: toIso(past),
    to: toIso(today),
  };
}

export default function ReportsPage() {
  const auth = useAppSelector((state) => state.auth);
  const defaults = useMemo(() => defaultDateRange(), []);

  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [report, setReport] = useState<SalesReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFetchReport() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await api.get<SalesReportResponse>("/reports/sales", {
        params: { from_date: fromDate, to_date: toDate },
      });
      setReport(response.data.data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Failed to fetch report. Check date range and try again.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExportCsv() {
    if (!auth.token) {
      setErrorMessage("Missing auth session. Please login again.");
      return;
    }

    try {
      const response = await api.get("/reports/sales/export-csv", {
        params: { from_date: fromDate, to_date: toDate },
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `sales-report-${fromDate}-to-${toDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to export CSV."));
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Reports</h2>
        <p className="text-sm text-slate-400">Sales report by date range with CSV export</p>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
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
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleFetchReport}
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Generate Report"}
            </button>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
              <p className="text-sm text-slate-400">Orders</p>
              <p className="text-xl font-bold text-slate-100">{report.summary.total_orders}</p>
            </article>
            <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
              <p className="text-sm text-slate-400">Subtotal</p>
              <p className="text-xl font-bold text-slate-100">
                {formatCurrency(report.summary.subtotal)}
              </p>
            </article>
            <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
              <p className="text-sm text-slate-400">VAT</p>
              <p className="text-xl font-bold text-slate-100">
                {formatCurrency(report.summary.vat_total)}
              </p>
            </article>
            <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
              <p className="text-sm text-slate-400">Grand Total</p>
              <p className="text-xl font-bold text-slate-100">
                {formatCurrency(report.summary.grand_total)}
              </p>
            </article>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Transactions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="px-2 py-2 font-medium">Order #</th>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Cashier</th>
                    <th className="px-2 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Subtotal</th>
                    <th className="px-2 py-2 font-medium">Discount</th>
                    <th className="px-2 py-2 font-medium">VAT</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-800">
                      <td className="px-2 py-2 text-slate-100">{order.order_number}</td>
                      <td className="px-2 py-2 text-slate-300">
                        {new Date(order.ordered_at).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-slate-300">{order.cashier?.name ?? "-"}</td>
                      <td className="px-2 py-2 text-slate-300">{"Walk-in"}</td>
                      <td className="px-2 py-2 text-slate-300">{formatCurrency(order.subtotal)}</td>
                      <td className="px-2 py-2 text-slate-300">{formatCurrency(order.discount_amount)}</td>
                      <td className="px-2 py-2 text-slate-300">{formatCurrency(order.vat_amount)}</td>
                      <td className="px-2 py-2 text-slate-300">{formatCurrency(order.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
