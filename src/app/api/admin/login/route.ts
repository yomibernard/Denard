import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/admin-api";

export async function POST(request: Request) {
  try {
    const { clientIp, rateLimit, rateLimitHeaders } = await import("@/lib/rate-limit");
    const limit = 8;
    const rl = rateLimit({
      key: `admin-login:${clientIp(request)}`,
      limit,
      windowMs: 15 * 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429, headers: rateLimitHeaders(rl, limit) },
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    if (!email || !password) return jsonError("Email and password required");

    const user = await authenticate(email, password);
    if (!user) return jsonError("Invalid credentials", 401);

    await createSession(user);
    return jsonOk({ user });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
