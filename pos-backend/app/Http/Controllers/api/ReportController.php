<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function sales(Request $request): JsonResponse
    {
        [$from, $to] = $this->resolveDateRange($request);

        $orders = Order::query()
            ->with(['cashier:id,name'])
            ->where('status', 'completed')
            ->whereBetween('ordered_at', [$from, $to])
            ->orderBy('ordered_at')
            ->get();

        $summary = [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'total_orders' => $orders->count(),
            'subtotal' => (float) $orders->sum('subtotal'),
            'discount_total' => (float) $orders->sum('discount_amount'),
            'vat_total' => (float) $orders->sum('vat_amount'),
            'grand_total' => (float) $orders->sum('total_amount'),
        ];

        return response()->json([
            'message' => 'Sales report generated successfully.',
            'data' => [
                'summary' => $summary,
                'orders' => $orders,
            ],
        ]);
    }

    public function exportSalesCsv(Request $request): StreamedResponse
    {
        [$from, $to] = $this->resolveDateRange($request);

        $orders = Order::query()
            ->with(['cashier:id,name'])
            ->where('status', 'completed')
            ->whereBetween('ordered_at', [$from, $to])
            ->orderBy('ordered_at')
            ->get();

        $filename = 'sales-report-'.$from->format('Ymd').'-'.$to->format('Ymd').'.csv';

        return response()->streamDownload(function () use ($orders): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Order Number',
                'Date',
                'Cashier',
                'Subtotal',
                'Discount',
                'VAT',
                'Total',
            ]);

            foreach ($orders as $order) {
                fputcsv($handle, [
                    $order->order_number,
                    optional($order->ordered_at)->format('Y-m-d H:i:s'),
                    $order->cashier?->name,
                    $order->subtotal,
                    $order->discount_amount,
                    $order->vat_amount,
                    $order->total_amount,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @return array{\Illuminate\Support\Carbon, \Illuminate\Support\Carbon}
     */
    private function resolveDateRange(Request $request): array
    {
        $validated = $request->validate([
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
        ]);

        $from = now()->parse($validated['from_date'])->startOfDay();
        $to = now()->parse($validated['to_date'])->endOfDay();

        return [$from, $to];
    }
}
