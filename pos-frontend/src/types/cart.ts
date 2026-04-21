export interface CartItem {
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface CartState {
  items: CartItem[];
  discountType: "fixed" | "percentage" | null;
  discountValue: number;
}
