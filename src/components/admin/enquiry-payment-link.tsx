"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";

export function EnquiryPaymentLinkPanel({
  enquiryId,
  paymentLinkUrl,
  stripeConfigured,
  estimatedTotalLabel,
}: {
  enquiryId: string;
  paymentLinkUrl: string | null;
  stripeConfigured: boolean;
  estimatedTotalLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [link, setLink] = useState(paymentLinkUrl);

  function createLink() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}/payment-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryAmount: delivery === "" ? null : Number(delivery),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not create payment link");
        return;
      }
      setLink(data.paymentUrl ?? null);
      setWhatsappUrl(data.whatsappUrl ?? null);
      router.refresh();
    });
  }

  if (!stripeConfigured) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Card payment link</h2>
        <p className="mt-2 text-xs text-muted">
          Stripe is not configured. Set <code className="text-[11px]">STRIPE_SECRET_KEY</code> to
          create hosted Checkout links for WhatsApp.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Card payment link</h2>
      <p className="mt-1 text-xs text-muted">
        Create a Stripe Checkout link for ~{estimatedTotalLabel}, then send it on WhatsApp.
      </p>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <label className="mt-3 mb-1 block text-xs font-medium text-ink-soft">
        Delivery add-on (optional, GBP)
      </label>
      <input
        type="number"
        min={0}
        step="0.01"
        className="h-9 w-full rounded border border-line px-3 text-sm"
        value={delivery}
        onChange={(e) => setDelivery(e.target.value)}
        placeholder="0.00"
      />

      <button
        type="button"
        disabled={pending}
        onClick={createLink}
        className="mt-3 h-9 w-full rounded bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : link ? "Create new payment link" : "Create payment link"}
      </button>

      {link ? (
        <div className="mt-3 space-y-2">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all text-xs text-accent hover:underline"
          >
            {link}
          </a>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded bg-[#1f6b45] px-4 text-sm font-medium text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Send payment link on WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
