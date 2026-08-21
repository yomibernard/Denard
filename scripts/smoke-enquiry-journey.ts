/**
 * Smoke test: create enquiry → WhatsApp URL with reference → admin-readable record.
 * Requires a running app DB with at least one PUBLISHED product.
 *
 * Run: npx tsx scripts/smoke-enquiry-journey.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { generateEnquiryReference } from "../src/lib/enquiry";
import {
  buildSingleProductMessage,
  buildWhatsAppUrl,
} from "../src/lib/whatsapp";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function resolveWhatsAppPhone() {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "whatsapp_phone" } });
    if (setting?.value) return setting.value.replace(/\D/g, "");
  } catch {
    /* ignore */
  }
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    process.env.WHATSAPP_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ??
    ""
  ).replace(/\D/g, "");
}

async function main() {
  const product = await prisma.product.findFirst({
    where: { status: "PUBLISHED" },
    include: { images: { take: 1 } },
  });
  assert(product, "No PUBLISHED product found — seed the database first.");

  const reference = await generateEnquiryReference();
  assert(/^DEN-\d{4}-\d{6}$/.test(reference), `Bad reference format: ${reference}`);

  const enquiry = await prisma.enquiry.create({
    data: {
      reference,
      customerName: "Smoke Test",
      customerPhone: "+447700900000",
      deliveryCity: "London",
      deliveryCountry: "United Kingdom",
      note: "Automated smoke test — safe to cancel",
      estimatedTotal: product.price,
      currency: product.currency,
      intendedAction: "ENQUIRY",
      status: "NEW",
      source: "smoke_test",
      pageSource: `/product/${product.slug}`,
      paymentStatus: "NONE",
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 1,
            unitPrice: product.price,
            lineTotal: product.price,
            productUrl: `/product/${product.slug}`,
            imageUrl: product.images[0]?.url,
          },
        ],
      },
    },
    include: { items: true },
  });

  const phone = await resolveWhatsAppPhone();
  assert(phone && /^\d{8,15}$/.test(phone), `Invalid WhatsApp phone: ${phone}`);

  const message = buildSingleProductMessage({
    product: {
      name: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.price,
      currency: product.currency,
      url: `https://denard.co.uk/product/${product.slug}`,
    },
    intendedAction: "ENQUIRY",
    note: "Smoke test",
    reference: enquiry.reference,
  });

  assert(message.includes(enquiry.reference), "Message missing enquiry reference");
  assert(message.includes(product.name), "Message missing product name");
  assert(!message.includes("Colour:\n"), "Empty colour field leaked");

  const url = buildWhatsAppUrl(phone, message);
  assert(url.startsWith(`https://wa.me/${phone}?text=`), "Bad wa.me URL");
  assert(url.includes(encodeURIComponent(enquiry.reference)), "Reference not encoded in URL");

  await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: {
      status: "WHATSAPP_OPENED",
      whatsappRedirected: true,
      whatsappRedirectedAt: new Date(),
    },
  });

  const tracked = await prisma.enquiry.findUnique({ where: { reference: enquiry.reference } });
  assert(tracked?.status === "WHATSAPP_OPENED", "Status not updated");

  // Mark cancelled so it does not clutter the owner inbox
  await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: { status: "CANCELLED", internalNotes: "Smoke test auto-cancelled" },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        reference: enquiry.reference,
        product: product.slug,
        whatsappHost: `wa.me/${phone}`,
        messagePreview: message.slice(0, 180) + "…",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error("SMOKE FAILED", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
