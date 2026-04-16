<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'ordered_at' => $this->ordered_at,
            'subtotal' => (float) $this->subtotal,
            'discount_amount' => (float) $this->discount_amount,
            'vat_rate' => (float) $this->vat_rate,
            'vat_amount' => (float) $this->vat_amount,
            'total_amount' => (float) $this->total_amount,
            'cashier' => [
                'id' => $this->cashier?->id,
                'name' => $this->cashier?->name,
                'email' => $this->cashier?->email,
                'role' => $this->cashier?->role?->slug,
            ],
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
