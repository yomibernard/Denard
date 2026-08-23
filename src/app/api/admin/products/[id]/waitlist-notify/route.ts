import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSession, jsonOk, requireAdmin } from "@/lib/admin-api";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, availability: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pending = await prisma.stockWaitlist.findMany({
    where: { productId: id, notifiedAt: null },
  });

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://denard.co.uk").replace(/\/$/, "");
  const url = `${site}/product/${product.slug}`;
  const now = new Date();
  let notified = 0;

  for (const row of pending) {
    const phone = row.phone.replace(/\D/g, "");
    const text = `Hello ${row.name}, ${product.name} is back at Denard. View it here: ${url}`;
    if (row.email) {
      await sendEmail({
        to: row.email,
        subject: `${product.name} is back in stock`,
        text,
      });
    }
    if (phone) {
      // Stored as WhatsApp deep link for staff to send, or customer already has phone.
      buildWhatsAppUrl(phone, text);
    }
    await prisma.stockWaitlist.update({
      where: { id: row.id },
      data: { notifiedAt: now },
    });
    notified += 1;
  }

  await writeAudit({
    action: "waitlist.notify",
    entityType: "Product",
    entityId: id,
    userId: session.id,
    details: { notified },
  });

  return jsonOk({ notified, waitlistUrlHint: url });
}
