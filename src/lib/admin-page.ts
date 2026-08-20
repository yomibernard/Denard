import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_PERMISSIONS, type SessionUser } from "@/lib/permissions";
import type { AdminPermission } from "@/lib/admin-api";

export async function requireAdminPage(permission?: AdminPermission): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (permission) {
    const perms = ROLE_PERMISSIONS[session.role];
    if (!perms[permission] && session.role !== "SUPER_ADMIN") {
      redirect("/admin");
    }
  }
  return session;
}
