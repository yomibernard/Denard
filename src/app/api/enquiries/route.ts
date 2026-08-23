import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateEnquiryReference } from "@/lib/enquiry";
import { absoluteUrl } from "@/lib/utils";
import {
  buildMultiProductMessage,
  buildSingleProductMessage,
  buildWhatsAppUrl,
  type IntendedActionType,
  type WhatsAppProductLine,
} from "@/lib/whatsapp";
import { getWhatsAppPhone } from "@/lib/whatsapp-server";
import { writeAudit } from "@/lib/audit";
import type { DeliveryMethod, DeviceType, IntendedAction } from "@/generated/prisma/client";

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
  deliveryCity: z.string().max(120).optional(),
  deliveryCountry: z.string().max(120).optional(),
  deliveryMethod: z
    .enum(["DELIVERY", "PICKUP", "COURIER", "TO_BE_CONFIRMED"])
    .optional()
    .default("TO_BE_CONFIRMED"),
  note: z.string().max(2000).optional(),
  intendedAction: z.enum(["ENQUIRY", "PAYMENT"]).default("ENQUIRY"),
  source: z.string().max(80).optional(),
  campaign: z.string().max(80).optional(),
  pageSource: z.string().max(500).optional(),
  /** Force multi-product message template (used by enquiry bag, even for one item). */
  messageFormat: z.enum(["single", "multi", "auto"]).optional().default("auto"),
  items: z.array(itemSchema).min(1).max(50),
});

function deviceFromUa(ua: string | null): DeviceType {
  if (!ua) return "UNKNOWN";
  const s = ua.toLowerCase();
  if (/ipad|tablet|kindle/.test(s)) return "TABLET";
  if (/mobi|iphone|android/.test(s)) return "MOBILE";
  if (/windows|macintosh|linux/.test(s)) return "DESKTOP";
  return "UNKNOWN";
}

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : absoluteUrl(url);
}

export async function POST(request: Request) {
  try {
    const { clientIp, rateLimit, rateLimitHeaders } = await import("@/lib/rate-limit");
    const limit = 12;
    const rl = rateLimit({
      key: `enquiry:${clientIp(request)}`,
      limit,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many enquiries. Please wait a minute and try again." },
        { status: 429, headers: rateLimitHeaders(rl, limit) },
      );
    }

    const json = await request.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid enquiry", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const idempotencyKey =
      request.headers.get("idempotency-key")?.trim() ||
      `${data.customerPhone.replace(/\D/g, "")}:${data.items
        .map((i) => `${i.productId}:${i.quantity}`)
        .sort()
        .join(",")}`;

    const recent = await prisma.enquiry.findFirst({
      where: {
        OR: [
          { idempotencyKey },
          {
            customerPhone: data.customerPhone,
            createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
          },
        ],
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      const phone = await getWhatsAppPhone();
      return NextResponse.json({
        reference: recent.reference,
        duplicate: true,
        confirmation: `We already have enquiry ${recent.reference}. Open WhatsApp to send it if you have not already.`,
        whatsappUrl: phone
          ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello Denard, following up on ${recent.reference}`)}`
          : null,
      });
    }

    // Validate products exist and are enquiry-ready
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, availability: true, status: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product unavailable: ${item.productName}` },
          { status: 400 },
        );
      }
      if (product.status !== "PUBLISHED" || product.availability === "OUT_OF_STOCK") {
        return NextResponse.json(
          { error: `${product.name} is currently unavailable.` },
          { status: 400 },
        );
      }
    }

    const ua = request.headers.get("user-agent");
    const reference = await generateEnquiryReference();
    const estimatedTotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const currency = "GBP";
    const intendedAction = data.intendedAction as IntendedAction;

    const enquiry = await prisma.enquiry.create({
      data: {
        reference,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryCity: data.deliveryCity,
        deliveryCountry: data.deliveryCountry,
        deliveryMethod: data.deliveryMethod as DeliveryMethod,
        note: data.note,
        estimatedTotal,
        currency,
        intendedAction,
        status: "NEW",
        idempotencyKey,
        source: data.source,
        campaign: data.campaign,
        pageSource: data.pageSource,
        deviceType: deviceFromUa(ua),
        userAgent: ua?.slice(0, 500),
        paymentStatus: "NONE",
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            productSku: item.productSku,
            colourName: item.colourName,
            sizeName: item.sizeName,
            variantLabel: item.variantLabel,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            compareAtPrice: item.compareAtPrice ?? null,
            lineTotal: item.unitPrice * item.quantity,
            productUrl: resolveUrl(item.productUrl),
            imageUrl: resolveUrl(item.imageUrl),
          })),
        },
      },
      include: { items: true },
    });

    await Promise.all(
      data.items.map((item) =>
        prisma.product
          .update({
            where: { id: item.productId },
            data: { enquiryCount: { increment: 1 } },
          })
          .catch(() => undefined),
      ),
    );

    const phone = await getWhatsAppPhone();
    if (!phone) {
      return NextResponse.json(
        { error: "WhatsApp number is not configured.", reference: enquiry.reference },
        { status: 500 },
      );
    }

    const waProducts: WhatsAppProductLine[] = enquiry.items.map((i) => ({
      name: i.productName,
      sku: i.productSku,
      colour: i.colourName,
      size: i.sizeName,
      variant: i.variantLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      compareAtPrice: i.compareAtPrice,
      currency,
      url: i.productUrl,
      imageUrl: i.imageUrl,
    }));

    const action = intendedAction as IntendedActionType;
    const useMulti =
      data.messageFormat === "multi" ||
      (data.messageFormat !== "single" && waProducts.length > 1);
    const message = useMulti
      ? buildMultiProductMessage({
          products: waProducts,
          customer: {
            name: enquiry.customerName,
            phone: enquiry.customerPhone,
            city: enquiry.deliveryCity ?? undefined,
            country: enquiry.deliveryCountry ?? undefined,
            note: enquiry.note ?? undefined,
          },
          intendedAction: action,
          reference: enquiry.reference,
          estimatedTotal,
          currency,
        })
      : buildSingleProductMessage({
          product: waProducts[0],
          intendedAction: action,
          note: enquiry.note ?? undefined,
          reference: enquiry.reference,
        });

    const whatsappUrl = buildWhatsAppUrl(phone, message);

    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        status: "WHATSAPP_OPENED",
        whatsappRedirected: true,
        whatsappRedirectedAt: new Date(),
      },
    });

    // Best-effort staff email alert (skipped when Resend is not configured)
    try {
      const { notifyNewEnquiry } = await import("@/lib/email");
      await notifyNewEnquiry({
        reference: enquiry.reference,
        customerName: enquiry.customerName,
        customerPhone: enquiry.customerPhone,
        itemSummary: enquiry.items
          .map((i) => `${i.quantity}× ${i.productName} (${i.productSku})`)
          .join(", "),
        adminUrl: absoluteUrl(`/admin/enquiries/${enquiry.id}`),
        trackUrl: absoluteUrl(`/track?reference=${enquiry.reference}`),
      });
    } catch (emailErr) {
      console.warn("enquiry email notify skipped", emailErr);
    }

    await writeAudit({
      action: "enquiry.create",
      entityType: "Enquiry",
      entityId: enquiry.id,
      details: { reference: enquiry.reference, source: data.source },
    });

    return NextResponse.json({
      reference: enquiry.reference,
      whatsappUrl,
      message,
      estimatedTotal,
      confirmation: `Your enquiry ${enquiry.reference} has been prepared. WhatsApp is opening so you can send it to Denard.`,
    });
  } catch (err) {
    console.error("enquiry create failed", err);
    return NextResponse.json({ error: "Could not create enquiry" }, { status: 500 });
  }
}
