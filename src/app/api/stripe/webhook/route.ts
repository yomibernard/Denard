import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
      }
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Dev-only fallback — never use unsigned webhooks in production
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET required" }, { status: 500 });
      }
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const enquiryId = session.metadata?.enquiryId;
      const reference = session.metadata?.enquiryReference || session.client_reference_id;

      const enquiry = enquiryId
        ? await prisma.enquiry.findUnique({ where: { id: enquiryId } })
        : reference
          ? await prisma.enquiry.findUnique({ where: { reference: String(reference) } })
          : null;

      if (enquiry) {
        const amountTotal =
          session.amount_total != null ? session.amount_total / 100 : enquiry.estimatedTotal;

        await prisma.enquiry.update({
          where: { id: enquiry.id },
          data: {
            paymentStatus: "CONFIRMED",
            paymentMethod: "Stripe Checkout",
            paymentReference: session.payment_intent
              ? String(session.payment_intent)
              : session.id,
            stripeCheckoutSessionId: session.id,
            paymentLinkUrl: enquiry.paymentLinkUrl,
            amountPaid: amountTotal,
            paymentDate: new Date(),
            status:
              enquiry.status === "CANCELLED" || enquiry.status === "COMPLETED"
                ? enquiry.status
                : "PAYMENT_CONFIRMED",
          },
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const enquiryId = session.metadata?.enquiryId;
      if (enquiryId) {
        await prisma.enquiry.updateMany({
          where: {
            id: enquiryId,
            paymentStatus: "PENDING",
            stripeCheckoutSessionId: session.id,
          },
          data: { paymentStatus: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe webhook handler failed", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
