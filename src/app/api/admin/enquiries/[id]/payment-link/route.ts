import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { formatPrice } from "@/lib/utils";
import {
  buildPaymentRequestMessage,
  createEnquiryCheckoutSession,
  stripeConfigured,
} from "@/lib/stripe";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await requireAdmin("enquiries");
  if (!isSession(session)) return session;

  if (!stripeConfigured()) {
    return jsonError(
      "Stripe is not configured. Set STRIPE_SECRET_KEY (and ideally STRIPE_WEBHOOK_SECRET) in the environment.",
      503,
    );
  }

  const { id } = await ctx.params;
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!enquiry) return jsonError("Enquiry not found", 404);
  if (!enquiry.items.length) return jsonError("Enquiry has no line items");

  try {
    const body = await request.json().catch(() => ({}));
    const deliveryAmount =
      body.deliveryAmount != null && body.deliveryAmount !== ""
        ? Number(body.deliveryAmount)
        : null;

    const checkout = await createEnquiryCheckoutSession({
      enquiryId: enquiry.id,
      reference: enquiry.reference,
      customerName: enquiry.customerName,
      customerPhone: enquiry.customerPhone,
      currency: enquiry.currency,
      deliveryAmount: deliveryAmount != null && !Number.isNaN(deliveryAmount) ? deliveryAmount : null,
      lines: enquiry.items.map((i) => ({
        name: i.productName,
        sku: i.productSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        currency: enquiry.currency,
      })),
    });

    const total =
      enquiry.estimatedTotal +
      (deliveryAmount != null && !Number.isNaN(deliveryAmount) ? deliveryAmount : 0);

    const updated = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        paymentLinkUrl: checkout.url,
        stripeCheckoutSessionId: checkout.sessionId,
        paymentStatus: "PENDING",
        paymentMethod: "Stripe Checkout",
        paymentReference: checkout.sessionId,
        status:
          enquiry.status === "PAYMENT_CONFIRMED" || enquiry.status === "COMPLETED"
            ? enquiry.status
            : "AWAITING_PAYMENT",
      },
    });

    const phone = enquiry.customerPhone.replace(/\D/g, "");
    const message = buildPaymentRequestMessage({
      customerName: enquiry.customerName,
      reference: enquiry.reference,
      amountLabel: formatPrice(total, enquiry.currency),
      paymentUrl: checkout.url,
    });
    const whatsappUrl = phone ? buildWhatsAppUrl(phone, message) : null;

    return jsonOk({
      enquiry: {
        id: updated.id,
        paymentLinkUrl: updated.paymentLinkUrl,
        paymentStatus: updated.paymentStatus,
        status: updated.status,
        stripeCheckoutSessionId: updated.stripeCheckoutSessionId,
      },
      paymentUrl: checkout.url,
      whatsappUrl,
      message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create payment link";
    return jsonError(message, 500);
  }
}
