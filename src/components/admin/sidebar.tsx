"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  MessageSquare,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_PERMISSIONS, type SessionUser } from "@/lib/permissions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products" as const },
  { href: "/admin/catalogue", label: "Catalogue", icon: FolderTree, permission: "catalogue" as const },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, permission: "enquiries" as const },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings" as const },
  { href: "/admin/users", label: "Users", icon: Users, permission: "users" as const },
];

export function AdminSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const perms = ROLE_PERMISSIONS[user.role];

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-ink text-white">
      <div className="border-b border-white/10 px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/brand/logos/icon.png"
          alt="Denard"
          className="h-12 w-auto object-contain object-left"
        />
        <p className="mt-2 font-display text-lg text-white">Denard</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Admin</p>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV.filter((item) => !item.permission || perms[item.permission]).map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-sm transition",
                active
                  ? "bg-accent text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="truncate text-xs font-medium text-white">{user.name}</p>
        <p className="truncate text-[11px] text-white/50">{user.email}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{user.role.replace(/_/g, " ")}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
