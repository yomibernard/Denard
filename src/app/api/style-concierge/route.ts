import { NextResponse } from "next/server";
import { z } from "zod";
import {
  polishStyleAdvice,
  recommendProducts,
} from "@/lib/recommendations";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const prefsSchema = z.object({
  occasions: z.array(z.string()).max(8).default([]),
  metals: z.array(z.string()).max(8).default([]),
  vibes: z.array(z.string()).max(8).default([]),
  focuses: z.array(z.string()).max(8).default([]),
  budgetMax: z.number().positive().max(50000).nullable().optional(),
});

const schema = z.object({
  seedIds: z.array(z.string()).max(24).optional(),
  excludeIds: z.array(z.string()).max(24).optional(),
  prefs: prefsSchema.optional(),
  limit: z.number().int().min(1).max(8).optional(),
  /** Optional free-text note from the shopper (not stored as PII profile) */
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const rl = rateLimit({
    key: `style:${clientIp(request)}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many style requests. Please wait a moment." },
      { status: 429, headers: rateLimitHeaders(rl, 20) },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const prefs = parsed.data.prefs
    ? {
        occasions: parsed.data.prefs.occasions,
        metals: parsed.data.prefs.metals,
        vibes: parsed.data.prefs.vibes,
        focuses: parsed.data.prefs.focuses,
        budgetMax: parsed.data.prefs.budgetMax ?? null,
      }
    : {
        occasions: [] as string[],
        metals: [] as string[],
        vibes: [] as string[],
        focuses: [] as string[],
        budgetMax: null as number | null,
      };

  const result = await recommendProducts({
    seedIds: parsed.data.seedIds,
    excludeIds: parsed.data.excludeIds,
    prefs,
    limit: parsed.data.limit ?? 6,
  });

  let narrative = result.narrative;
  if (parsed.data.note?.trim()) {
    narrative = `${narrative} You also noted: “${parsed.data.note.trim()}”.`;
  }

  const advice = await polishStyleAdvice({
    narrative,
    productNames: result.products.map((p) => p.name),
    prefs,
  });

  await writeAudit({
    action: "style.concierge",
    entityType: "Style",
    entityId: "anonymous",
    details: {
      seeds: parsed.data.seedIds?.length ?? 0,
      proposed: result.products.length,
      coldStart: result.coldStart,
      llm: Boolean(process.env.OPENAI_API_KEY?.trim()),
    },
  });

  return NextResponse.json({
    ...result,
    narrative,
    advice,
    aiEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
}
