import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";
import { ROLE_PERMISSIONS, type SessionUser } from "@/lib/permissions";

export type { SessionUser };
export { ROLE_PERMISSIONS };

const COOKIE = "denard_admin_session";

function authSecretBytes() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value || value === "dev-secret" || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SECRET must be set to a random string of at least 32 characters in production.",
      );
    }
    console.warn(
      "[denard] AUTH_SECRET is missing or weak. Set a 32+ character secret before production.",
    );
    return new TextEncoder().encode(value && value.length >= 16 ? value : "dev-only-insecure-secret");
  }
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function assertStrongPassword(password: string) {
  if (password.length < 10) {
    return "Password must be at least 10 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include letters and numbers.";
  }
  return null;
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecretBytes());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecretBytes());
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: UserRole[]) {
  const session = await getSession();
  if (!session) return null;
  if (roles && !roles.includes(session.role) && session.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

export async function authenticate(email: string, password: string) {
  const normalized = email.toLowerCase().trim();
  const aliases =
    normalized.endsWith("@denard.co.uk")
      ? [normalized, normalized.replace(/@denard\.co\.uk$/, "@denard.com")]
      : normalized.endsWith("@denard.com")
        ? [normalized, normalized.replace(/@denard\.com$/, "@denard.co.uk")]
        : [normalized];

  const user = await prisma.user.findFirst({
    where: { email: { in: aliases } },
  });
  if (!user || !user.active) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  } satisfies SessionUser;
}
