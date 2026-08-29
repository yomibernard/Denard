"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  STYLE_BUDGETS,
  STYLE_FOCUSES,
  STYLE_METALS,
  STYLE_OCCASIONS,
  STYLE_VIBES,
  summarizePrefs,
} from "@/lib/style-prefs";
import {
  useEnquiryBasket,
  useRecentlyViewed,
  useStylePrefs,
  useWishlist,
} from "@/store/commerce";
import type { ProductCardData } from "@/components/product/product-card";
import { formatPrice } from "@/lib/utils";

type ConciergeProduct = ProductCardData & { reason?: string };

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "border-mint-deep bg-mint-deep/10 text-ink"
          : "border-line bg-surface text-ink-soft hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}

export function StyleConcierge({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [products, setProducts] = useState<ConciergeProduct[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const prefs = useStylePrefs((s) => s.prefs);
  const togglePref = useStylePrefs((s) => s.togglePref);
  const setBudgetMax = useStylePrefs((s) => s.setBudgetMax);
  const recent = useRecentlyViewed((s) => s.productIds);
  const wishlist = useWishlist((s) => s.ids);
  const bagIds = useEnquiryBasket((s) => s.items.map((i) => i.productId));

  useEffect(() => {
    if (!open) return;
    trackEvent({ eventName: "style_concierge_open" });
  }, [open]);

  async function runConcierge() {
    setLoading(true);
    setError(null);
    const seedIds = [...recent, ...wishlist, ...bagIds].slice(0, 16);
    try {
      const res = await fetch("/api/style-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedIds,
          prefs,
          note: note.trim() || undefined,
          limit: 6,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not build your edit.");
        return;
      }
      setAdvice(data.advice ?? data.narrative ?? null);
      setProducts(data.products ?? []);
      trackEvent({
        eventName: "style_prefs_save",
        meta: { proposed: data.products?.length ?? 0 },
      });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const waMessage = [
    "Hello Denard,",
    "",
    "I’d like a personal style edit.",
    "",
    `My taste: ${summarizePrefs(prefs)}`,
    note.trim() ? `Note: ${note.trim()}` : null,
    products.length
      ? `Suggested pieces I’m interested in:\n${products
          .slice(0, 4)
          .map((p) => `- ${p.name} (${p.sku ?? p.slug})`)
          .join("\n")}`
      : null,
    "",
    "Please propose what works for me and confirm availability.",
    "",
    "Thank you.",
  ]
    .filter(Boolean)
    .join("\n");

  const waHref = phone ? buildWhatsAppUrl(phone, waMessage) : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open style concierge"
        className={cn(
          "fixed bottom-36 right-4 z-40 flex h-11 w-11 items-center justify-center",
          "bg-ink text-canvas ring-1 ring-ink/10",
          "transition-colors duration-200 hover:bg-mint-deep",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-deep focus-visible:ring-offset-2",
          "sm:bottom-20 sm:right-5",
        )}
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.6} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-ink/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="style-concierge-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden border border-line bg-canvas shadow-lg sm:max-w-md">
            <div className="flex items-start justify-between border-b border-line px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Style concierge
                </p>
                <h2 id="style-concierge-title" className="mt-1 font-display text-2xl text-ink">
                  What works for you
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-muted hover:bg-sand hover:text-ink"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm">
              <p className="text-ink-soft">
                We use what you browse, save and tell us — then propose pieces that fit your taste.
                Preferences stay on this device.
              </p>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Focus
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STYLE_FOCUSES.map((f) => (
                    <Chip
                      key={f.id}
                      active={prefs.focuses.includes(f.id)}
                      onClick={() => togglePref("focuses", f.id)}
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Metals
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STYLE_METALS.map((f) => (
                    <Chip
                      key={f.id}
                      active={prefs.metals.includes(f.id)}
                      onClick={() => togglePref("metals", f.id)}
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Vibe
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STYLE_VIBES.map((f) => (
                    <Chip
                      key={f.id}
                      active={prefs.vibes.includes(f.id)}
                      onClick={() => togglePref("vibes", f.id)}
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Occasions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STYLE_OCCASIONS.map((f) => (
                    <Chip
                      key={f.id}
                      active={prefs.occasions.includes(f.id)}
                      onClick={() => togglePref("occasions", f.id)}
                    >
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Budget guide
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STYLE_BUDGETS.map((b) => (
                    <Chip
                      key={String(b.value)}
                      active={prefs.budgetMax === b.value}
                      onClick={() => setBudgetMax(b.value)}
                    >
                      {b.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="style-note" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Anything else?
                </label>
                <textarea
                  id="style-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. sensitive to nickel, prefer hoops, gift for mum…"
                  className="mt-2 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              {advice ? (
                <div className="rounded border border-line bg-surface px-3 py-3 text-ink-soft">
                  {advice}
                </div>
              ) : null}

              {products.length ? (
                <ul className="space-y-3">
                  {products.map((p) => (
                    <li key={p.id} className="flex gap-3 border-b border-line pb-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${p.slug}`}
                          className="font-display text-lg text-ink hover:text-accent"
                          onClick={() => setOpen(false)}
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">{p.reason}</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatPrice(p.price, p.currency)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-line p-4">
              <button
                type="button"
                className={buttonClassName({ variant: "primary", className: "w-full" })}
                disabled={loading}
                onClick={() => void runConcierge()}
              >
                {loading ? "Building your edit…" : "Propose pieces for me"}
              </button>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName({ variant: "whatsapp", className: "w-full" })}
                  onClick={() => trackEvent({ eventName: "style_whatsapp_handoff" })}
                >
                  Continue on WhatsApp
                </a>
              ) : null}
              <Link
                href="/style"
                className={buttonClassName({ variant: "outline", className: "w-full" })}
                onClick={() => setOpen(false)}
              >
                Full style profile
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
