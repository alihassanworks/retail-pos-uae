"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Main Menu", icon: "□" },
  { href: "/pos", label: "POS Billing", icon: "$" },
  { href: "/products", label: "Products", icon: "#" },
  { href: "/orders", label: "Orders", icon: "=" },
  { href: "/reports", label: "Reports", icon: "*" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/95 p-4">
      <h1 className="mb-1 text-lg font-bold text-slate-100">Retail POS</h1>
      <p className="mb-6 text-xs text-slate-400">Inventory & Billing</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/40"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-xs">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
