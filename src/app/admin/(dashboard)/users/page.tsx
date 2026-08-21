import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";
import { UsersManager } from "@/components/admin/users-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  await requireAdminPage("users");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      phone: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Create staff accounts, reset passwords, and change your own password.
        </p>
      </div>
      <UsersManager
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
