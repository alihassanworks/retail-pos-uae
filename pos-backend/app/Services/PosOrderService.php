<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosOrderService
{
    private const VAT_RATE = 5.00;

    /**
     * @param array<string, mixed> $payload
     */
    public function createOrder(array $payload, int $cashierId): Order
    {
        return DB::transaction(function () use ($payload, $cashierId): Order {
            $items = $payload['items'];
            $discountType = $payload['discount_type'] ?? null;
            $discountValue = (float) ($payload['discount_value'] ?? 0);

            $productIds = collect($items)->pluck('product_id')->unique()->values();

            /** @var \Illuminate\Support\Collection<int, Product> $products */
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0.00;
            $orderItems = [];

            foreach ($items as $item) {
                /** @var Product|null $product */
                $product = $products->get($item['product_id']);
                $quantity = (int) $item['quantity'];

                if (! $product || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ["Product ID {$item['product_id']} is invalid or inactive."],
                    ]);
                }

                if ($product->stock_quantity < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => ["Insufficient stock for {$product->name}."],
                    ]);
                }

                $lineSubtotal = round($quantity * (float) $product->price, 2);
                $subtotal += $lineSubtotal;

                $orderItems[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'line_subtotal' => $lineSubtotal,
                ];
            }

            $subtotal = round($subtotal, 2);
            $discountAmount = $this->calculateDiscount($subtotal, $discountType, $discountValue);
            $taxableBase = max(0, round($subtotal - $discountAmount, 2));
            $vatAmount = round($taxableBase * (self::VAT_RATE / 100), 2);
            $totalAmount = round($taxableBase + $vatAmount, 2);

            $paymentTotal = round(
                collect($payload['payments'])->sum(fn (array $payment): float => (float) $payment['amount']),
                2
            );

            if ($paymentTotal !== $totalAmount) {
                throw ValidationException::withMessages([
                    'payments' => ["Payment total {$paymentTotal} must equal order total {$totalAmount}."],
                ]);
            }

            $order = Order::query()->create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $cashierId,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'vat_rate' => self::VAT_RATE,
                'vat_amount' => $vatAmount,
                'total_amount' => $totalAmount,
                'status' => 'completed',
                'ordered_at' => now(),
            ]);

            foreach ($orderItems as $item) {
                /** @var Product $product */
                $product = $item['product'];
                $lineSubtotal = $item['line_subtotal'];
                $lineDiscount = $subtotal > 0 ? round(($lineSubtotal / $subtotal) * $discountAmount, 2) : 0.00;
                $taxableLine = max(0, round($lineSubtotal - $lineDiscount, 2));
                $lineVat = round($taxableLine * (self::VAT_RATE / 100), 2);
                $lineTotal = round($taxableLine + $lineVat, 2);

                $order->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'line_subtotal' => $lineSubtotal,
                    'line_discount_amount' => $lineDiscount,
                    'line_vat_amount' => $lineVat,
                    'line_total' => $lineTotal,
                ]);

                $product->decrement('stock_quantity', $item['quantity']);
            }

            foreach ($payload['payments'] as $payment) {
                $order->payments()->create([
                    'method' => $payment['method'],
                    'amount' => $payment['amount'],
                    'reference' => $payment['reference'] ?? null,
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
            }

            return $order->load(['cashier.role', 'items.product', 'payments']);
        });
    }

    private function calculateDiscount(float $subtotal, ?string $discountType, float $discountValue): float
    {
        if (! $discountType || $discountValue <= 0) {
            return 0.00;
        }

        if ($discountType === 'percentage') {
            return round(min($subtotal, ($subtotal * $discountValue) / 100), 2);
        }

        return round(min($subtotal, $discountValue), 2);
    }

    private function generateOrderNumber(): string
    {
        return 'ORD-'.now()->format('YmdHis').'-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT);
    }
}
