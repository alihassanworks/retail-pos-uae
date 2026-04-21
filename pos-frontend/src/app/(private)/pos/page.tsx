"use client";

import { useEffect, useMemo, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCart,
  applyDiscount,
  clearDiscount,
  clearCart,
  removeFromCart,
  updateCartQuantity,
} from "@/store/slices/cartSlice";

type DiscountType = "fixed" | "percentage";
type PaymentMode = "cash" | "card" | "split";

interface ProductDto {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface ProductsApiResponse {
  data: ProductDto[];
}

export default function PosPage() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const subtotal = useMemo(
    () =>
      cart.items.reduce(
        (sum: number, item: any) => sum + item.unitPrice * item.quantity,
        0
      ),
    [cart.items]
  );

  const discountAmount = useMemo(() => {
    if (!cart.discountType || cart.discountValue <= 0) return 0;

    if (cart.discountType === "percentage") {
      return Math.min(subtotal, (subtotal * cart.discountValue) / 100);
    }

    return Math.min(subtotal, cart.discountValue);
  }, [cart.discountType, cart.discountValue, subtotal]);

  const taxable = Math.max(0, subtotal - discountAmount);
  const vatAmount = taxable * 0.05;
  const totalAmount = taxable + vatAmount;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.get<ProductsApiResponse>("/products");
        setProducts(response.data.data);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to load products."));
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
    );
  }, [products, searchTerm]);

  function handleAddProduct(product: ProductDto) {
    if (!product.is_active || product.stock_quantity <= 0) return;

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: Number(product.price),
      })
    );
  }

  function handleBarcodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sku = barcodeInput.trim().toLowerCase();
    if (!sku) return;

    const product = products.find((item) => item.sku.toLowerCase() === sku);
    if (!product) {
      setErrorMessage("No product found for this barcode/SKU.");
      return;
    }

    handleAddProduct(product);
    setBarcodeInput("");
    setErrorMessage("");
  }

  function handleDiscount(type: DiscountType, value: number) {
    dispatch(applyDiscount({ type, value: Number.isNaN(value) ? 0 : value }));
  }

  async function handleCheckout() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!cart.items.length) {
      setErrorMessage("Cart is empty.");
      return;
    }

    const payments =
      paymentMode === "split"
        ? [
            { method: "cash", amount: cashAmount },
            { method: "card", amount: cardAmount },
          ].filter((item) => item.amount > 0)
        : [{ method: paymentMode, amount: totalAmount }];

    const paymentSum = payments.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(paymentSum - totalAmount) > 0.009) {
      setErrorMessage("Payment split must match the total amount.");
      return;
    }

    setIsCheckingOut(true);

    try {
      await api.post("/orders", {
        items: cart.items.map((item: any) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        discount_type: cart.discountType,
        discount_value: cart.discountValue,
        payments,
      });

      dispatch(clearCart());
      setCashAmount(0);
      setCardAmount(0);
      setSuccessMessage("Order completed successfully.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Checkout failed. Please verify stock and payment values.")
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm lg:col-span-2">
        <h2 className="text-xl font-bold text-slate-100">POS Product Search</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by product name or SKU"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500"
          />
          <form onSubmit={handleBarcodeSubmit}>
            <input
              value={barcodeInput}
              onChange={(event) => setBarcodeInput(event.target.value)}
              placeholder="Scan barcode / enter SKU then Enter"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </form>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleAddProduct(product)}
              disabled={!product.is_active || product.stock_quantity <= 0}
              className="rounded-md border border-slate-700 bg-slate-950 p-3 text-left hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="font-semibold text-slate-100">{product.name}</p>
              <p className="text-xs text-slate-400">SKU: {product.sku}</p>
              <p className="mt-2 text-sm text-slate-200">AED {Number(product.price).toFixed(2)}</p>
              <p className="text-xs text-slate-400">Stock: {product.stock_quantity}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h3 className="text-lg font-bold text-slate-100">Cart</h3>

        <div className="max-h-72 space-y-2 overflow-auto">
          {cart.items.map((item: any) => (
            <div key={item.productId} className="rounded-md border border-slate-700 bg-slate-950 p-2">
              <p className="text-sm font-semibold text-slate-100">{item.name}</p>
              <p className="text-xs text-slate-400">{item.sku}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    dispatch(
                      updateCartQuantity({
                        productId: item.productId,
                        quantity: Number(event.target.value),
                      })
                    )
                  }
                  className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                />
                <p className="text-sm font-medium text-slate-200">
                  AED {(item.unitPrice * item.quantity).toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(removeFromCart(item.productId))}
                  className="text-xs text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-md border border-slate-700 bg-slate-950 p-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={cart.discountType ?? ""}
              onChange={(event) => {
                const selected = event.target.value as DiscountType | "";
                if (!selected) {
                  dispatch(clearDiscount());
                  return;
                }
                handleDiscount(selected, cart.discountValue);
              }}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            >
              <option value="">No discount</option>
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </select>
            <input
              type="number"
              min={0}
              step="0.01"
              value={cart.discountValue}
              onChange={(event) =>
                handleDiscount(
                  (cart.discountType ?? "fixed") as DiscountType,
                  Number(event.target.value)
                )
              }
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500"
              placeholder="Discount"
            />
          </div>

          <div className="space-y-1 text-sm text-slate-300">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>AED {subtotal.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>Discount</span>
              <span>- AED {discountAmount.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>VAT (5%)</span>
              <span>AED {vatAmount.toFixed(2)}</span>
            </p>
            <p className="flex justify-between border-t border-slate-700 pt-1 font-semibold text-slate-100">
              <span>Total</span>
              <span>AED {totalAmount.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <select
            value={paymentMode}
            onChange={(event) => setPaymentMode(event.target.value as PaymentMode)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="split">Split</option>
          </select>

          {paymentMode === "split" && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                value={cashAmount}
                onChange={(event) => setCashAmount(Number(event.target.value))}
                placeholder="Cash amount"
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={cardAmount}
                onChange={(event) => setCardAmount(Number(event.target.value))}
                placeholder="Card amount"
                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          )}
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isCheckingOut ? "Processing..." : "Complete Order"}
        </button>
      </div>
    </section>
  );
}
