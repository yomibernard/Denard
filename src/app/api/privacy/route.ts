import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/captcha";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["access", "correction", "erasure", "restriction", "complaint"]),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  details: z.string().max(4000).optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const limit = 5;
  const rl = rateLimit({ key: `privacy:${clientIp(request)}`, limit, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: rateLimitHeaders(rl, limit) },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the form." }, { status: 400 });
  }

  const captcha = await verifyTurnstile(parsed.data.turnstileToken, clientIp(request));
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error ?? "Verification required" }, { status: 400 });
  }

  const row = await prisma.privacyRequest.create({
    data: {
      kind: parsed.data.kind,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      details: parsed.data.details || null,
    },
  });

  await writeAudit({
    action: "privacy.request",
    entityType: "PrivacyRequest",
    entityId: row.id,
    details: { kind: parsed.data.kind },
  });

  const staff = process.env.ENQUIRY_NOTIFY_EMAIL?.trim() || process.env.ADMIN_DEFAULT_EMAIL?.trim();
  if (staff) {
    await sendEmail({
      to: staff,
      subject: `[Denard] Privacy request (${parsed.data.kind})`,
      text: `${parsed.data.name} <${parsed.data.email}> requested ${parsed.data.kind}.\n\n${parsed.data.details ?? ""}`,
    });
  }

  return NextResponse.json(
    { ok: true, message: "Request received. We will respond within 30 days." },
    { headers: rateLimitHeaders(rl, limit) },
  );
}
