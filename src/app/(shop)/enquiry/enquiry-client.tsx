"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";
import { useEnquiryBasket } from "@/store/commerce";
import type { IntendedActionType } from "@/lib/whatsapp";
import { EnquiryOfflineBanner, persistFailedEnquiry } from "@/components/enquiry/offline-retry";
import {
  cancelWhatsAppLaunch,
  completeWhatsAppLaunch,
  prepareWhatsAppLaunch,
} from "@/lib/whatsapp-launch";

export default function EnquiryPageClient() {
  const searchParams = useSearchParams();
  const items = useEnquiryBasket((s) => s.items);
  const updateQuantity = useEnquiryBasket((s) => s.updateQuantity);
  const removeItem = useEnquiryBasket((s) => s.removeItem);
  const clear = useEnquiryBasket((s) => s.clear);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [intendedAction, setIntendedAction] = useState<IntendedActionType>("ENQUIRY");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [cardEnabled, setCardEnabled] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((d) => setCardEnabled(Boolean(d.enabled)))
      .catch(() => setCardEnabled(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      setError(
        searchParams.get("reference")
          ? `Card payment was cancelled. Your reference ${searchParams.get("reference")} is saved — you can pay again or send on WhatsApp.`
          : "Card payment was cancelled. You can try again or enquire on WhatsApp.",
      );
    }
  }, [searchParams]);

  function buildPayload() {
    return {
      customerName: name,
      customerPhone: phone,
      deliveryCity: city,
      deliveryCountry: country,
      note: note || undefined,
      intendedAction,
      messageFormat: "multi" as const,
      source: "enquiry_bag",
      pageSource: typeof window !== "undefined" ? window.location.href : "/enquiry",
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        productName: i.name,
        productSku: i.sku,
        colourName: i.colour,
        sizeName: i.size,
        variantLabel: i.variant,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        compareAtPrice: i.compareAtPrice,
        productUrl: `/product/${i.slug}`,
        imageUrl: i.imageUrl,
      })),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current) return;
    if (!items.length) {
      setError("Your enquiry list is empty.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setError(null);
    const prepared = prepareWhatsAppLaunch();
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.whatsappUrl) {
        cancelWhatsAppLaunch(prepared);
        setError(data.error ?? "Could not submit enquiry.");
        try {
          persistFailedEnquiry(buildPayload());
        } catch {
          /* ignore */
        }
        return;
      }
      setReference(data.reference);
      setConfirmation(
        data.confirmation ??
          `Your enquiry ${data.reference} has been prepared. WhatsApp is opening so you can send it to Denard.`,
      );
      setWhatsappUrl(data.whatsappUrl);
      trackEvent({
        eventName: "enquiry_submit",
        meta: { reference: data.reference, items: items.length, action: intendedAction },
      });
      completeWhatsAppLaunch(data.whatsappUrl, prepared);
    } catch {
      cancelWhatsAppLaunch(prepared);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  async function onPayByCard() {
    if (submitLock.current) return;
    if (!items.length) {
      setError("Your bag is empty.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Name and telephone are required before card payment.");
      return;
    }
    submitLock.current = true;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildPayload(),
          customerEmail: email || undefined,
          intendedAction: "PAYMENT",
          source: "shop_checkout",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Could not start card payment.");
        if (data.reference) setReference(data.reference);
        return;
      }
      trackEvent({
        eventName: "checkout_start",
        meta: { reference: data.reference, items: items.length },
      });
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Could not start card payment. Please try WhatsApp instead.");
    } finally {
      setPaying(false);
      submitLock.current = false;
    }
  }

  if (reference && confirmation) {
    return (
      <div className="container-denard mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-3xl text-ink">Enquiry prepared</h1>
        <p className="mt-3 text-ink-soft">{confirmation}</p>
        <div className="mt-6 rounded-[var(--denard-radius)] border border-line bg-surface px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Your reference
          </p>
          <p className="mt-1 font-mono text-lg font-semibold text-ink">{reference}</p>
        </div>
        <ol className="mt-6 space-y-2 text-left text-sm text-ink-soft">
          <li>1. Send the WhatsApp message to Denard (if it didn’t open, use the button below).</li>
          <li>2. Keep your reference handy — you’ll need it to track progress.</li>
          <li>3. We’ll confirm availability, delivery and payment on WhatsApp.</li>
        </ol>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName({ variant: "whatsapp", className: "mt-6 inline-flex" })}
          >
            Open WhatsApp again
          </a>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/track?reference=${encodeURIComponent(reference)}`}
            className={buttonClassName()}
          >
            Track enquiry
          </Link>
          <Link
            href="/shop"
            className={buttonClassName({ variant: "outline" })}
            onClick={() => clear()}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-denard py-8 md:py-12">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Your bag</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Review your pieces, then{" "}
        {cardEnabled ? (
          <>
            <strong className="font-medium text-ink">pay securely by card</strong> or send an enquiry
            on WhatsApp. Delivery timing is confirmed after payment or in chat.
          </>
        ) : (
          <>
            send them to Denard on WhatsApp. Availability, delivery and payment are confirmed in chat.
          </>
        )}
      </p>

      {!items.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="relative mb-6 h-40 w-52">
            <Image src="/images/empty/enquiry-empty.svg" alt="" fill className="object-contain" />
          </div>
          <p className="text-sm text-muted">Your bag is empty.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/shop" className={buttonClassName({ variant: "primary" })}>
              Continue shopping
            </Link>
            <Link href="/how-to-order" className={buttonClassName({ variant: "outline" })}>
              How to order
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4 py-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-sand">
                  <Image
                    src={item.imageUrl ?? "/images/hero.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-display text-lg text-ink hover:text-accent"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">Reference: {item.sku}</p>
                  <p className="mt-1 text-sm font-medium">
                    {formatPrice(item.unitPrice * item.quantity, item.currency)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.key, Number(e.target.value) || 1)}
                        className="h-10 w-16 rounded-[var(--denard-radius)] border border-line bg-surface px-2 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-xs text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <form
            onSubmit={onSubmit}
            className="h-fit space-y-4 rounded-[var(--denard-radius)] border border-line bg-surface p-5"
          >
            <h2 className="font-display text-xl text-ink">Your details</h2>
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telephone number</Label>
              <Input
                id="phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+44…"
              />
            </div>
            {cardEnabled ? (
              <div>
                <Label htmlFor="email">Email (for card receipt)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="optional"
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="city">Delivery city</Label>
              <Input
                id="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </div>
            <div>
              <Label htmlFor="country">Delivery country</Label>
              <Input
                id="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country-name"
              />
            </div>
            <div>
              <Label htmlFor="action">Preferred action</Label>
              <Select
                id="action"
                value={intendedAction}
                onChange={(e) => setIntendedAction(e.target.value as IntendedActionType)}
              >
                <option value="ENQUIRY">Make an enquiry</option>
                <option value="PAYMENT">Complete payment</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="note">Message (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Sizing, timing, gift wrap…"
              />
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
              <span className="text-muted">Estimated subtotal</span>
              <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[11px] text-muted">
              Prices are in GBP. Delivery cost (if any) is confirmed after payment or on WhatsApp.
            </p>

            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <EnquiryOfflineBanner />

            {cardEnabled ? (
              <Button
                type="button"
                variant="primary"
                className="min-h-12 w-full"
                disabled={submitting || paying}
                onClick={onPayByCard}
              >
                {paying ? "Redirecting to secure payment…" : "Pay by card"}
              </Button>
            ) : null}

            <Button
              type="submit"
              variant="whatsapp"
              className="min-h-12 w-full"
              disabled={submitting || paying}
            >
              {submitting ? "Preparing…" : "Send on WhatsApp"}
            </Button>
            <Link
              href="/shop"
              className={buttonClassName({ variant: "outline", className: "w-full" })}
            >
              Continue shopping
            </Link>
          </form>
        </div>
      )}
    </div>
  );
}
