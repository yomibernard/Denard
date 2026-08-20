import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/admin-api";

export async function POST(request: Request) {
  try {
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
