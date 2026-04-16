<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'product_sku' => $this->product_sku,
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'line_subtotal' => (float) $this->line_subtotal,
            'line_discount_amount' => (float) $this->line_discount_amount,
            'line_vat_amount' => (float) $this->line_vat_amount,
            'line_total' => (float) $this->line_total,
        ];
    }
}
