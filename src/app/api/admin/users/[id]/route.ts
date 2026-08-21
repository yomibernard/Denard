import { prisma } from "@/lib/db";
import {
  assertStrongPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import type { UserRole } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ROLES = [
  "SUPER_ADMIN",
  "BUSINESS_OWNER",
  "PRODUCT_MANAGER",
  "CATALOGUE_ADMIN",
  "SALES_REP",
  "CUSTOMER_SERVICE",
  "MARKETING",
  "REPORTING",
] as const;

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("users");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return jsonError("User not found", 404);

  try {
    const body = await request.json();

    // Self password change: { currentPassword, newPassword }
    if (body.newPassword != null && body.currentPassword != null) {
      if (session.id !== id && session.role !== "SUPER_ADMIN" && session.role !== "BUSINESS_OWNER") {
        return jsonError("Not allowed to change this password", 403);
      }
      const strength = assertStrongPassword(String(body.newPassword));
      if (strength) return jsonError(strength, 400);

      if (session.id === id) {
        const ok = await verifyPassword(String(body.currentPassword), target.passwordHash);
        if (!ok) return jsonError("Current password is incorrect", 400);
      }

      await prisma.user.update({
        where: { id },
        data: { passwordHash: await hashPassword(String(body.newPassword)) },
      });
      return jsonOk({ ok: true });
    }

    // Admin reset password (no current password): { resetPassword }
    if (body.resetPassword != null) {
      if (session.role !== "SUPER_ADMIN" && session.role !== "BUSINESS_OWNER") {
        return jsonError("Not allowed", 403);
      }
      const strength = assertStrongPassword(String(body.resetPassword));
      if (strength) return jsonError(strength, 400);
      await prisma.user.update({
        where: { id },
        data: { passwordHash: await hashPassword(String(body.resetPassword)) },
      });
      return jsonOk({ ok: true });
    }

    const data: {
      name?: string;
      role?: UserRole;
      active?: boolean;
      phone?: string | null;
    } = {};

    if (body.name != null) data.name = String(body.name).trim();
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
    if (body.active != null) data.active = Boolean(body.active);
    if (body.role != null) {
      const role = String(body.role);
      if (!(ROLES as readonly string[]).includes(role)) return jsonError("Invalid role", 400);
      if (
        role === "SUPER_ADMIN" &&
        session.role !== "SUPER_ADMIN" &&
        session.role !== "BUSINESS_OWNER"
      ) {
        return jsonError("Not allowed", 403);
      }
      data.role = role as UserRole;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
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
    return jsonOk({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
