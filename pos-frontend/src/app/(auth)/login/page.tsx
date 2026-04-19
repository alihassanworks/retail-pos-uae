"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { api, setApiToken } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth-storage";
import { useAppDispatch } from "@/store/hooks";
import { loginSuccess, setLoading } from "@/store/slices/authSlice";
import type { AuthUser } from "@/types/auth";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginApiResponse {
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      role?: { slug: "admin" | "manager" | "cashier" };
    };
  };
}

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  async function onSubmit(values: LoginFormData) {
    setErrorMessage("");
    dispatch(setLoading(true));

    try {
      const response = await api.post<LoginApiResponse>("/auth/login", values);
      const token = response.data.data.token;
      const apiUser = response.data.data.user;

      const user: AuthUser = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role?.slug ?? "cashier",
      };

      setApiToken(token);
      saveAuthSession(token, user);
      dispatch(loginSuccess({ user, token }));

      const redirectPath = params.get("redirect") || "/dashboard";
      router.replace(redirectPath);
    } catch {
      setErrorMessage("Invalid credentials. Please check email and password.");
      dispatch(setLoading(false));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-100">Retail POS Login</h1>
        <p className="mt-1 text-sm text-slate-400">Access your POS dashboard</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
