"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";
import { useEnquiryBasket } from "@/store/commerce";
import type { IntendedActionType } from "@/lib/whatsapp";
import {
  cancelWhatsAppLaunch,
  completeWhatsAppLaunch,
  prepareWhatsAppLaunch,
} from "@/lib/whatsapp-launch";

export default function EnquiryPage() {
  const items = useEnquiryBasket((s) => s.items);
  const updateQuantity = useEnquiryBasket((s) => s.updateQuantity);
  const removeItem = useEnquiryBasket((s) => s.removeItem);
  const clear = useEnquiryBasket((s) => s.clear);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [intendedAction, setIntendedAction] = useState<IntendedActionType>("ENQUIRY");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const submitLock = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current) return;
    if (!items.length) {
      setError("Your enquiry bag is empty.");
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
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          deliveryCity: city,
          deliveryCountry: country,
          note: note || undefined,
          intendedAction,
          messageFormat: "multi",
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.whatsappUrl) {
        cancelWhatsAppLaunch(prepared);
        setError(data.error ?? "Could not submit enquiry.");
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
      const { opened } = completeWhatsAppLaunch(data.whatsappUrl, prepared);
      if (!opened) {
        // Confirmation screen still shows the Open WhatsApp button.
      }
    } catch {
      cancelWhatsAppLaunch(prepared);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  if (reference && confirmation) {
    return (
      <div className="container-denard mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-3xl text-ink">Enquiry prepared</h1>
        <p className="mt-3 text-ink-soft">{confirmation}</p>
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
          <Link href="/track" className={buttonClassName()}>
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
        {items.length ? (
          <p className="mt-4 text-xs text-muted">
            Your enquiry bag is still saved until you continue shopping.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="container-denard py-8 md:py-12">
      <h1 className="font-display text-3xl text-ink md:text-4xl">Enquiry bag</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Review your selections, then send them to Denard on WhatsApp. Payment is arranged in chat —
        we never collect card details here.
      </p>

      {!items.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="relative mb-6 h-40 w-52">
            <Image
              src="/images/empty/enquiry-empty.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm text-muted">Your enquiry bag is empty.</p>
          <Link href="/shop" className={buttonClassName({ variant: "primary", className: "mt-5" })}>
            Continue shopping
          </Link>
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
                  <p className="mt-0.5 text-xs text-muted">
                    {[
                      item.colour ? `Colour: ${item.colour}` : null,
                      item.size ? `Size: ${item.size}` : null,
                      item.variant ? `Variant: ${item.variant}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Unit </span>
                    <span className="font-medium">
                      {formatPrice(item.unitPrice, item.currency)}
                    </span>
                    {item.compareAtPrice != null && item.compareAtPrice > item.unitPrice ? (
                      <span className="ml-2 text-xs text-muted line-through">
                        {formatPrice(item.compareAtPrice, item.currency)}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    Subtotal {formatPrice(item.unitPrice * item.quantity, item.currency)}
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
                    <Link
                      href={`/product/${item.slug}`}
                      className="text-xs text-accent hover:underline"
                    >
                      Edit
                    </Link>
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

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button type="submit" variant="whatsapp" className="min-h-12 w-full" disabled={submitting}>
              {submitting ? "Preparing…" : "Send all to WhatsApp"}
            </Button>
            <Link href="/shop" className={buttonClassName({ variant: "outline", className: "w-full" })}>
              Continue shopping
            </Link>
          </form>
        </div>
      )}
    </div>
  );
}
