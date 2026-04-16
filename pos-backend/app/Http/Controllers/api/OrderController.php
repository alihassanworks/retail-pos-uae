<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\PosOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(private readonly PosOrderService $posOrderService)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        $orders = Order::query()
            ->with(['cashier.role', 'items.product', 'payments'])
            ->latest('ordered_at')
            ->paginate(15);

        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->posOrderService->createOrder(
            payload: $request->validated(),
            cashierId: (int) $request->user()->id
        );

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['cashier.role', 'items.product', 'payments']));
    }
}
