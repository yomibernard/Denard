import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendProducts } from "@/lib/recommendations";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const prefsSchema = z.object({
  occasions: z.array(z.string()).max(8).default([]),
  metals: z.array(z.string()).max(8).default([]),
  vibes: z.array(z.string()).max(8).default([]),
  focuses: z.array(z.string()).max(8).default([]),
  budgetMax: z.number().positive().max(50000).nullable().optional(),
});

const bodySchema = z.object({
  seedIds: z.array(z.string()).max(24).optional(),
  excludeIds: z.array(z.string()).max(24).optional(),
  prefs: prefsSchema.optional(),
  limit: z.number().int().min(1).max(12).optional(),
});

export async function POST(request: Request) {
  const rl = rateLimit({
    key: `recs:${clientIp(request)}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rl, 40) },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data = parsed.data;
  const result = await recommendProducts({
    seedIds: data.seedIds,
    excludeIds: data.excludeIds,
    prefs: data.prefs
      ? {
          occasions: data.prefs.occasions,
          metals: data.prefs.metals,
          vibes: data.prefs.vibes,
          focuses: data.prefs.focuses,
          budgetMax: data.prefs.budgetMax ?? null,
        }
      : undefined,
    limit: data.limit,
  });

  return NextResponse.json(result);
}

/** Lightweight GET for seed-only rails */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seedIds = (searchParams.get("seeds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
  const excludeIds = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
  const limit = Number(searchParams.get("limit") ?? "8");

  const result = await recommendProducts({ seedIds, excludeIds, limit });
  return NextResponse.json(result);
}
