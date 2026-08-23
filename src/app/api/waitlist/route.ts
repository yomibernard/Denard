import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/captcha";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string().min(1),
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().email().optional().or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const limit = 8;
  const rl = rateLimit({ key: `waitlist:${clientIp(request)}`, limit, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: rateLimitHeaders(rl, limit) },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist request" }, { status: 400 });
  }

  const captcha = await verifyTurnstile(parsed.data.turnstileToken, clientIp(request));
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error ?? "Verification required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true, availability: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const existing = await prisma.stockWaitlist.findFirst({
    where: {
      productId: product.id,
      phone: parsed.data.phone,
      notifiedAt: null,
    },
  });
  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  await prisma.stockWaitlist.create({
    data: {
      productId: product.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
    },
  });

  await writeAudit({
    action: "waitlist.join",
    entityType: "Product",
    entityId: product.id,
    details: { phone: parsed.data.phone },
  });

  const staff = process.env.ENQUIRY_NOTIFY_EMAIL?.trim();
  if (staff) {
    await sendEmail({
      to: staff,
      subject: `[Denard] Waitlist: ${product.name}`,
      text: `${parsed.data.name} (${parsed.data.phone}) asked to be notified when ${product.name} is back.`,
    });
  }

  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl, limit) });
}
