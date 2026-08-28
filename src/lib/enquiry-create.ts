import "server-only";
import { prisma } from "@/lib/db";
import { generateEnquiryReference } from "@/lib/enquiry";
import { absoluteUrl } from "@/lib/utils";
import { writeAudit } from "@/lib/audit";
import type { DeliveryMethod, DeviceType, IntendedAction } from "@/generated/prisma/client";

export type CheckoutLineInput = {
  productId: string;
  variantId?: string;
  productName: string;
  productSku: string;
  colourName?: string;
  sizeName?: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number | null;
  productUrl?: string;
  imageUrl?: string;
};

export type CreateEnquiryInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryCity?: string;
  deliveryCountry?: string;
  deliveryMethod?: DeliveryMethod;
  note?: string;
  intendedAction?: IntendedAction;
  source?: string;
  campaign?: string;
  pageSource?: string;
  items: CheckoutLineInput[];
  userAgent?: string | null;
  idempotencyKey?: string;
};

function deviceFromUa(ua: string | null | undefined): DeviceType {
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

export async function validateEnquiryProducts(items: CheckoutLineInput[]) {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, availability: true, status: true, name: true, price: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { ok: false as const, error: `Product unavailable: ${item.productName}` };
    }
    if (product.status !== "PUBLISHED" || product.availability === "OUT_OF_STOCK") {
      return { ok: false as const, error: `${product.name} is currently unavailable.` };
    }
  }
  return { ok: true as const, products: productMap };
}

/** Create a shop enquiry (WhatsApp or card checkout precursor). */
export async function createShopEnquiry(input: CreateEnquiryInput) {
  const validation = await validateEnquiryProducts(input.items);
  if (!validation.ok) return validation;

  const idempotencyKey =
    input.idempotencyKey ||
    `${input.customerPhone.replace(/\D/g, "")}:${input.items
      .map((i) => `${i.productId}:${i.quantity}`)
      .sort()
      .join(",")}`;

  const recent = await prisma.enquiry.findFirst({
    where: {
      OR: [
        { idempotencyKey },
        {
          customerPhone: input.customerPhone,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return { ok: true as const, enquiry: recent, duplicate: true as const };
  }

  const reference = await generateEnquiryReference();
  const estimatedTotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const currency = "GBP";
  const intendedAction = input.intendedAction ?? "ENQUIRY";

  const enquiry = await prisma.enquiry.create({
    data: {
      reference,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryCity: input.deliveryCity || null,
      deliveryCountry: input.deliveryCountry || null,
      deliveryMethod: input.deliveryMethod ?? "TO_BE_CONFIRMED",
      note: [
        input.note,
        input.customerEmail ? `Email: ${input.customerEmail}` : null,
      ]
        .filter(Boolean)
        .join("\n") || null,
      estimatedTotal,
      currency,
      intendedAction,
      status: "NEW",
      idempotencyKey,
      source: input.source ?? "shop",
      campaign: input.campaign || null,
      pageSource: input.pageSource || null,
      deviceType: deviceFromUa(input.userAgent),
      userAgent: input.userAgent?.slice(0, 500) || null,
      paymentStatus: "NONE",
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || null,
          productName: item.productName,
          productSku: item.productSku,
          colourName: item.colourName || null,
          sizeName: item.sizeName || null,
          variantLabel: item.variantLabel || null,
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
    input.items.map((item) =>
      prisma.product
        .update({
          where: { id: item.productId },
          data: { enquiryCount: { increment: 1 } },
        })
        .catch(() => undefined),
    ),
  );

  await writeAudit({
    action: "enquiry.create",
    entityType: "Enquiry",
    entityId: enquiry.id,
    details: { reference: enquiry.reference, source: enquiry.source, intendedAction },
  });

  return { ok: true as const, enquiry, duplicate: false as const };
}
