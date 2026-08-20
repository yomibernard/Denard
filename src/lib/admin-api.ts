import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { ROLE_PERMISSIONS, type SessionUser } from "@/lib/permissions";
import type { UserRole } from "@/generated/prisma/client";

export type AdminPermission = keyof (typeof ROLE_PERMISSIONS)[UserRole];

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdmin(
  permission?: AdminPermission,
  roles?: UserRole[],
): Promise<SessionUser | NextResponse> {
  const session = await requireSession(roles);
  if (!session) {
    return jsonError("Unauthorized", 401);
  }
  if (permission) {
    const perms = ROLE_PERMISSIONS[session.role];
    if (!perms[permission] && session.role !== "SUPER_ADMIN") {
      return jsonError("Forbidden", 403);
    }
  }
  return session;
}

export function isSession(value: SessionUser | NextResponse): value is SessionUser {
  return !(value instanceof NextResponse);
}
