"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  category?: { id: number; name: string; slug: string };
}

interface CategoriesResponse {
  data: Category[];
}

interface ProductsResponse {
  data: Product[];
}

interface ProductFormInput {
  category_id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export default function ProductsPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const canManage = role === "admin" || role === "manager";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    defaultValues: {
      low_stock_threshold: 10,
      stock_quantity: 0,
      is_active: true,
    },
  });

  async function loadData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [categoryRes, productRes] = await Promise.all([
        api.get<CategoriesResponse>("/categories"),
        api.get<ProductsResponse>("/products"),
      ]);

      setCategories(categoryRes.data.data);
      setProducts(productRes.data.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load products page data."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onSubmit(values: ProductFormInput) {
    setFeedback("");
    setErrorMessage("");

    try {
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, values);
        setFeedback("Product updated successfully.");
      } else {
        await api.post("/products", values);
        setFeedback("Product added successfully.");
      }

      setEditingProductId(null);
      reset({
        category_id: values.category_id,
        name: "",
        sku: "",
        price: 0,
        stock_quantity: 0,
        low_stock_threshold: 10,
        is_active: true,
      });
      await loadData();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to add product."));
    }
  }

  function handleEditProduct(product: Product) {
    setEditingProductId(product.id);
    setValue("category_id", product.category?.id ?? 0);
    setValue("name", product.name);
    setValue("sku", product.sku);
    setValue("price", Number(product.price));
    setValue("stock_quantity", product.stock_quantity);
    setValue("low_stock_threshold", product.low_stock_threshold);
    setValue("is_active", product.is_active);
    setFeedback("");
    setErrorMessage("");
  }

  function handleCancelEdit() {
    setEditingProductId(null);
    reset({
      category_id: 0,
      name: "",
      sku: "",
      price: 0,
      stock_quantity: 0,
      low_stock_threshold: 10,
      is_active: true,
    });
  }

  async function handleDeleteProduct(productId: number) {
    setFeedback("");
    setErrorMessage("");

    const shouldDelete = window.confirm("Delete this product?");
    if (!shouldDelete) return;

    try {
      await api.delete(`/products/${productId}`);
      setFeedback("Product deleted successfully.");

      if (editingProductId === productId) {
        handleCancelEdit();
      }

      await loadData();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to delete product."));
    }
  }

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Products</h2>
        <p className="text-sm text-slate-400">
          Manage product catalog, pricing, and stock levels.
        </p>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {feedback && <p className="text-sm text-green-600">{feedback}</p>}

      {canManage && (
        <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-100">
            {editingProductId ? "Edit Product" : "Add Product"}
          </h3>

          {!categories.length && (
            <p className="mb-3 text-sm text-amber-400">
              No categories found. Run backend seeder to create default categories.
            </p>
          )}

          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Category</label>
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                {...register("category_id", { required: "Category is required", valueAsNumber: true })}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-xs text-red-600">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Name</label>
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">SKU</label>
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                {...register("sku", { required: "SKU is required" })}
              />
              {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                {...register("price", { required: "Price is required", valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Stock Quantity</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                {...register("stock_quantity", {
                  required: "Stock quantity is required",
                  valueAsNumber: true,
                })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                {...register("low_stock_threshold", { valueAsNumber: true })}
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" {...register("is_active")} />
                Active product
              </label>

              <div className="flex gap-2">
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !categories.length}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSubmitting
                    ? editingProductId
                      ? "Updating..."
                      : "Adding..."
                    : editingProductId
                      ? "Update Product"
                      : "Add Product"}
                </button>
              </div>
            </div>
          </form>
        </article>
      )}

      <article className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Product List</h3>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading products...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="px-2 py-2 font-medium">Name</th>
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">Category</th>
                  <th className="px-2 py-2 font-medium">Price</th>
                  <th className="px-2 py-2 font-medium">Stock</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  {canManage && <th className="px-2 py-2 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-slate-800">
                    <td className="px-2 py-2 text-slate-100">{product.name}</td>
                    <td className="px-2 py-2">{product.sku}</td>
                    <td className="px-2 py-2">{product.category?.name ?? "-"}</td>
                    <td className="px-2 py-2">AED {Number(product.price).toFixed(2)}</td>
                    <td className="px-2 py-2">
                      {product.stock_quantity}
                      {product.stock_quantity <= product.low_stock_threshold && (
                        <span className="ml-2 rounded bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
                          Low
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {product.is_active ? (
                        <span className="rounded bg-green-900/40 px-2 py-0.5 text-xs text-green-300">
                          Active
                        </span>
                      ) : (
                        <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-2 py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditProduct(product)}
                            className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
