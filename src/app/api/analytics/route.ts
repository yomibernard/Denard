import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  eventName: z.string().min(1).max(120),
  path: z.string().max(500).optional(),
  productId: z.string().optional(),
  categoryId: z.string().optional(),
  searchTerm: z.string().max(200).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().optional(),
  deviceType: z.enum(["MOBILE", "TABLET", "DESKTOP", "UNKNOWN"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { eventName, path, productId, categoryId, searchTerm, meta, sessionId, deviceType } =
      parsed.data;

    await prisma.analyticsEvent.create({
      data: {
        eventName,
        path,
        productId,
        categoryId,
        searchTerm,
        metaJson: meta ? JSON.stringify(meta) : null,
        sessionId,
        deviceType: deviceType ?? "UNKNOWN",
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
