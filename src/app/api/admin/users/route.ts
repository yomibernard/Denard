import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertStrongPassword, hashPassword } from "@/lib/auth";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import type { UserRole } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

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

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(10).max(200),
  role: z.enum(ROLES).default("SALES_REP"),
  phone: z.string().max(40).optional(),
});

export async function GET() {
  const session = await requireAdmin("users");
  if (!isSession(session)) return session;

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
  return jsonOk({ users });
}

export async function POST(request: Request) {
  const session = await requireAdmin("users");
  if (!isSession(session)) return session;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid user details", 400);
    }
    const strength = assertStrongPassword(parsed.data.password);
    if (strength) return jsonError(strength, 400);

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("A user with that email already exists", 409);

    // Only SUPER_ADMIN / BUSINESS_OWNER can create SUPER_ADMIN
    if (
      parsed.data.role === "SUPER_ADMIN" &&
      session.role !== "SUPER_ADMIN" &&
      session.role !== "BUSINESS_OWNER"
    ) {
      return jsonError("Not allowed to create SUPER_ADMIN", 403);
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role as UserRole,
        phone: parsed.data.phone?.trim() || null,
        active: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return jsonOk({ user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    return jsonError(message, 500);
  }
}
