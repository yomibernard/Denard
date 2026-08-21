import "server-only";
import Stripe from "stripe";
import { absoluteUrl } from "@/lib/utils";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    typescript: true,
  });
}

export type EnquiryPaymentLine = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
};

/**
 * Create a Stripe Checkout Session for an enquiry (GBP card payment).
 * Returns the hosted payment URL to send on WhatsApp.
 */
export async function createEnquiryCheckoutSession(opts: {
  enquiryId: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  currency: string;
  lines: EnquiryPaymentLine[];
  /** Optional delivery/surcharge in major units (e.g. pounds) */
  deliveryAmount?: number | null;
}) {
  const stripe = getStripe();
  const currency = (opts.currency || "GBP").toLowerCase();

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = opts.lines.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency,
      unit_amount: Math.round(line.unitPrice * 100),
      product_data: {
        name: line.name,
        metadata: { sku: line.sku },
      },
    },
  }));

  if (opts.deliveryAmount && opts.deliveryAmount > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: Math.round(opts.deliveryAmount * 100),
        product_data: { name: "Delivery" },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: absoluteUrl(
      `/track?reference=${encodeURIComponent(opts.reference)}&paid=1`,
    ),
    cancel_url: absoluteUrl(
      `/track?reference=${encodeURIComponent(opts.reference)}&paid=0`,
    ),
    client_reference_id: opts.reference,
    metadata: {
      enquiryId: opts.enquiryId,
      enquiryReference: opts.reference,
      customerPhone: opts.customerPhone,
    },
    payment_intent_data: {
      metadata: {
        enquiryId: opts.enquiryId,
        enquiryReference: opts.reference,
      },
    },
    customer_creation: "if_required",
    phone_number_collection: { enabled: false },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export function buildPaymentRequestMessage(opts: {
  customerName: string;
  reference: string;
  amountLabel: string;
  paymentUrl: string;
}) {
  return [
    `Hello ${opts.customerName},`,
    "",
    `Your Denard enquiry ${opts.reference} is ready for payment.`,
    `Amount: ${opts.amountLabel}`,
    "",
    "Pay securely here:",
    opts.paymentUrl,
    "",
    "After payment we will confirm and arrange fulfilment on WhatsApp.",
    "Thank you — Denard",
  ].join("\n");
}
