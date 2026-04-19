"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/auth-storage";
import { setApiToken } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const pageTitle = useMemo(() => {
    const map: Record<string, string> = {
      "/dashboard": "Main Menu",
      "/pos": "POS Billing",
      "/products": "Product Management",
      "/orders": "Orders Management",
      "/reports": "Reports & Exports",
    };

    return map[pathname] ?? "Back Office";
  }, [pathname]);

  function handleLogout() {
    clearAuthSession();
    setApiToken(null);
    dispatch(logout());
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">UAE Retail Management</p>
        <p className="text-base font-semibold text-slate-100">{pageTitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="hidden text-xs text-slate-500 md:block">{new Date().toLocaleString()}</p>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-100">{user?.name ?? "Guest"}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {user?.role ?? "-"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
