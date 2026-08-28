import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createShopEnquiry } from "@/lib/enquiry-create";
import {
  createEnquiryCheckoutSession,
  stripeConfigured,
} from "@/lib/stripe";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  productName: z.string().min(1),
  productSku: z.string().min(1),
  colourName: z.string().optional(),
  sizeName: z.string().optional(),
  variantLabel: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  productUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

const schema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(7).max(40),
  customerEmail: z.string().email().optional().or(z.literal("")),
  deliveryCity: z.string().max(120).optional(),
  deliveryCountry: z.string().max(120).optional(),
  note: z.string().max(2000).optional(),
  source: z.string().max(80).optional(),
  pageSource: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1).max(50),
});

/** Public: whether customer card checkout is available. */
export async function GET() {
  return NextResponse.json({
    enabled: stripeConfigured() && process.env.DISABLE_SHOP_CHECKOUT !== "true",
    currency: "GBP",
  });
}

/** Create enquiry + Stripe Checkout Session, return hosted payment URL. */
export async function POST(request: Request) {
  if (!stripeConfigured() || process.env.DISABLE_SHOP_CHECKOUT === "true") {
    return NextResponse.json(
      { error: "Card checkout is not available right now. Please enquire on WhatsApp." },
      { status: 503 },
    );
  }

  const limit = 8;
  const rl = rateLimit({
    key: `checkout:${clientIp(request)}`,
    limit,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a minute." },
      { status: 429, headers: rateLimitHeaders(rl, limit) },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete your details and items.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const created = await createShopEnquiry({
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || null,
    deliveryCity: data.deliveryCity,
    deliveryCountry: data.deliveryCountry || "United Kingdom",
    deliveryMethod: "DELIVERY",
    note: data.note,
    intendedAction: "PAYMENT",
    source: data.source ?? "shop_checkout",
    pageSource: data.pageSource,
    items: data.items,
    userAgent: request.headers.get("user-agent"),
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  const enquiry = created.enquiry;

  if (created.duplicate && enquiry.paymentStatus === "CONFIRMED") {
    return NextResponse.json(
      {
        error:
          "A recent payment for this number is already confirmed. Track your order or wait a few minutes before starting a new checkout.",
        reference: enquiry.reference,
      },
      { status: 409 },
    );
  }

  // If a recent duplicate already has a live payment link, reuse it
  if (created.duplicate && enquiry.paymentLinkUrl && enquiry.paymentStatus === "PENDING") {
    return NextResponse.json({
      reference: enquiry.reference,
      checkoutUrl: enquiry.paymentLinkUrl,
      duplicate: true,
    });
  }

  try {
    const checkout = await createEnquiryCheckoutSession({
      enquiryId: enquiry.id,
      reference: enquiry.reference,
      customerName: enquiry.customerName,
      customerPhone: enquiry.customerPhone,
      currency: enquiry.currency,
      flow: "shop",
      customerEmail: data.customerEmail || null,
      lines: enquiry.items.map((i) => ({
        name: i.productName,
        sku: i.productSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        currency: enquiry.currency,
      })),
    });

    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        paymentLinkUrl: checkout.url,
        stripeCheckoutSessionId: checkout.sessionId,
        paymentStatus: "PENDING",
        paymentMethod: "Stripe Checkout",
        paymentReference: checkout.sessionId,
        status: "AWAITING_PAYMENT",
        intendedAction: "PAYMENT",
      },
    });

    await writeAudit({
      action: "checkout.session.create",
      entityType: "Enquiry",
      entityId: enquiry.id,
      details: { reference: enquiry.reference, sessionId: checkout.sessionId },
    });

    return NextResponse.json({
      reference: enquiry.reference,
      checkoutUrl: checkout.url,
      estimatedTotal: enquiry.estimatedTotal,
    });
  } catch (err) {
    console.error("shop checkout failed", err);
    return NextResponse.json(
      {
        error: "Could not start card payment. Please try WhatsApp enquiry instead.",
        reference: enquiry.reference,
      },
      { status: 500 },
    );
  }
}
