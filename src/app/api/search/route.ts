import { NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { clientIp, rateLimit, rateLimitHeaders } = await import("@/lib/rate-limit");
  const limit = 40;
  const rl = rateLimit({ key: `search:${clientIp(request)}`, limit, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(rl, limit) },
    );
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const data = await searchSuggestions(q);
  return NextResponse.json(data, { headers: rateLimitHeaders(rl, limit) });
}
