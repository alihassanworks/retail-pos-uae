"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CartState } from "@/types/cart";

const initialState: CartState = {
  items: [],
  discountType: null,
  discountValue: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    updateCartQuantity(
      state,
      action: PayloadAction<{ productId: number; quantity: number }>
    ) {
      const item = state.items.find(
        (cartItem) => cartItem.productId === action.payload.productId
      );
      if (!item) return;
      item.quantity = Math.max(1, action.payload.quantity);
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },
    applyDiscount(
      state,
      action: PayloadAction<{ type: "fixed" | "percentage"; value: number }>
    ) {
      state.discountType = action.payload.type;
      state.discountValue = Math.max(0, action.payload.value);
    },
    clearDiscount(state) {
      state.discountType = null;
      state.discountValue = 0;
    },
    clearCart(state) {
      state.items = [];
      state.discountType = null;
      state.discountValue = 0;
    },
  },
});

export const {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  applyDiscount,
  clearDiscount,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
