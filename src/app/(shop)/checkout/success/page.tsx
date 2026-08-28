import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { CheckoutSuccessClear } from "@/components/checkout/checkout-success-clear";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Payment received",
  description: "Your Denard card payment confirmation.",
  path: "/checkout/success",
  noIndex: true,
});

type Props = {
  searchParams: Promise<{ reference?: string; session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const reference = sp.reference?.trim() || "";
  const sessionId = sp.session_id?.trim() || "";

  let enquiry = reference
    ? await prisma.enquiry.findUnique({
        where: { reference },
        include: { items: true },
      })
    : null;

  // Prefer Stripe session confirmation when available
  if (sessionId && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" && enquiry) {
        if (enquiry.paymentStatus !== "CONFIRMED") {
          enquiry = await prisma.enquiry.update({
            where: { id: enquiry.id },
            data: {
              paymentStatus: "CONFIRMED",
              paymentMethod: "Stripe Checkout",
              paymentReference: session.payment_intent
                ? String(session.payment_intent)
                : session.id,
              stripeCheckoutSessionId: session.id,
              amountPaid:
                session.amount_total != null ? session.amount_total / 100 : enquiry.estimatedTotal,
              paymentDate: new Date(),
              status:
                enquiry.status === "CANCELLED" || enquiry.status === "COMPLETED"
                  ? enquiry.status
                  : "PAYMENT_CONFIRMED",
            },
            include: { items: true },
          });
        }
      }
    } catch {
      /* webhook may still update */
    }
  }

  const paid =
    enquiry?.paymentStatus === "CONFIRMED" ||
    enquiry?.status === "PAYMENT_CONFIRMED" ||
    Boolean(sessionId);

  return (
    <div className="container-denard mx-auto max-w-lg py-16 text-center">
      <CheckoutSuccessClear />
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        {paid ? "Payment received" : "Order received"}
      </p>
      <h1 className="mt-3 font-display text-3xl text-ink md:text-4xl">
        {paid ? "Thank you" : "We’re confirming your payment"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        {paid
          ? "Your card payment went through. Denard will confirm fulfilment and delivery on WhatsApp using your enquiry reference."
          : "If you completed payment, confirmation can take a moment. Keep your reference and check Track enquiry."}
      </p>

      {reference ? (
        <div className="mt-8 rounded border border-line bg-surface px-4 py-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Your reference
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-ink">{reference}</p>
          {enquiry ? (
            <p className="mt-2 text-sm text-ink-soft">
              {enquiry.items.length} item{enquiry.items.length === 1 ? "" : "s"} ·{" "}
              {formatPrice(enquiry.amountPaid ?? enquiry.estimatedTotal, enquiry.currency)}
              {enquiry.paymentStatus === "CONFIRMED" ? " paid" : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {reference ? (
          <Link
            href={`/track?reference=${encodeURIComponent(reference)}`}
            className={buttonClassName({ variant: "primary" })}
          >
            Track order
          </Link>
        ) : null}
        <Link href="/shop" className={buttonClassName({ variant: "outline" })}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
