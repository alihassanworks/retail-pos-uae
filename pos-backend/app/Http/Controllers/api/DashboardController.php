<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $dailySales = (float) Order::query()
            ->whereDate('ordered_at', today())
            ->where('status', 'completed')
            ->sum('total_amount');

        $monthlySales = (float) Order::query()
            ->whereMonth('ordered_at', now()->month)
            ->whereYear('ordered_at', now()->year)
            ->where('status', 'completed')
            ->sum('total_amount');

        $totalOrders = (int) Order::query()
            ->where('status', 'completed')
            ->count();

        $topProducts = OrderItem::query()
            ->select('product_id', 'product_name', DB::raw('SUM(quantity) as sold_quantity'))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('sold_quantity')
            ->limit(5)
            ->get();

        $revenueTrend = Order::query()
            ->selectRaw('DATE(ordered_at) as date, SUM(total_amount) as revenue')
            ->where('status', 'completed')
            ->whereDate('ordered_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $recentTransactions = Order::query()
            ->with(['cashier:id,name'])
            ->where('status', 'completed')
            ->latest('ordered_at')
            ->limit(10)
            ->get();

        return response()->json([
            'message' => 'Dashboard analytics fetched successfully.',
            'data' => [
                'kpis' => [
                    'daily_sales' => $dailySales,
                    'monthly_sales' => $monthlySales,
                    'total_orders' => $totalOrders,
                ],
                'top_products' => $topProducts,
                'revenue_trend' => $revenueTrend,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }
}
