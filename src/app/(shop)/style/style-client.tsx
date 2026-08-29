"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ForYouRail } from "@/components/style/for-you-rail";
import { buttonClassName } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import {
  STYLE_BUDGETS,
  STYLE_FOCUSES,
  STYLE_METALS,
  STYLE_OCCASIONS,
  STYLE_VIBES,
  summarizePrefs,
} from "@/lib/style-prefs";
import { useStylePrefs } from "@/store/commerce";
import { cn } from "@/lib/utils";

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
        "rounded border px-3 py-2 text-sm transition-colors",
        active
          ? "border-mint-deep bg-mint-deep/10 text-ink"
          : "border-line bg-surface text-ink-soft hover:border-ink/30",
      )}
    >
      {children}
    </button>
  );
}

export default function StylePageClient() {
  const prefs = useStylePrefs((s) => s.prefs);
  const togglePref = useStylePrefs((s) => s.togglePref);
  const setBudgetMax = useStylePrefs((s) => s.setBudgetMax);
  const reset = useStylePrefs((s) => s.reset);
  const [savedFlash, setSavedFlash] = useState(false);

  const summary = useMemo(() => summarizePrefs(prefs), [prefs]);

  useEffect(() => {
    trackEvent({ eventName: "style_profile_view" });
  }, []);

  function onSaveNotice() {
    setSavedFlash(true);
    trackEvent({ eventName: "style_prefs_save", meta: { source: "style_page" } });
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div>
      <section className="border-b border-line bg-gradient-to-b from-sand/80 to-canvas">
        <div className="container-denard py-12 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Taste & fashion
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">Your style profile</h1>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Denard learns from what you browse and save, then proposes pieces that fit. Set your
            metals, vibe and occasions here — preferences stay on this device and power{" "}
            <strong className="font-medium text-ink">For you</strong> recommendations across the shop.
          </p>
          <p className="mt-3 text-sm text-muted">Current edit: {summary}</p>
          {savedFlash ? (
            <p className="mt-2 text-sm text-mint-deep">Preferences saved on this device.</p>
          ) : null}
        </div>
      </section>

      <section className="container-denard py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl text-ink">Focus</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {STYLE_FOCUSES.map((f) => (
                  <Chip
                    key={f.id}
                    active={prefs.focuses.includes(f.id)}
                    onClick={() => {
                      togglePref("focuses", f.id);
                      onSaveNotice();
                    }}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink">Metals</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {STYLE_METALS.map((f) => (
                  <Chip
                    key={f.id}
                    active={prefs.metals.includes(f.id)}
                    onClick={() => {
                      togglePref("metals", f.id);
                      onSaveNotice();
                    }}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink">Vibe</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {STYLE_VIBES.map((f) => (
                  <Chip
                    key={f.id}
                    active={prefs.vibes.includes(f.id)}
                    onClick={() => {
                      togglePref("vibes", f.id);
                      onSaveNotice();
                    }}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink">Occasions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {STYLE_OCCASIONS.map((f) => (
                  <Chip
                    key={f.id}
                    active={prefs.occasions.includes(f.id)}
                    onClick={() => {
                      togglePref("occasions", f.id);
                      onSaveNotice();
                    }}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink">Budget guide</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {STYLE_BUDGETS.map((b) => (
                  <Chip
                    key={String(b.value)}
                    active={prefs.budgetMax === b.value}
                    onClick={() => {
                      setBudgetMax(b.value);
                      onSaveNotice();
                    }}
                  >
                    {b.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className={buttonClassName({ variant: "primary" })}>
                Shop your edit
              </Link>
              <button
                type="button"
                className={buttonClassName({ variant: "outline" })}
                onClick={() => {
                  reset();
                  onSaveNotice();
                }}
              >
                Reset preferences
              </button>
            </div>
            <p className="text-xs text-muted">
              For a named CRM profile and marketing emails, use newsletter opt-in or WhatsApp with
              your enquiry reference. Style preferences alone are not used for email marketing.
            </p>
          </div>
          <div>
            <ForYouRail title="Proposed for you" flush />
          </div>
        </div>
      </section>
    </div>
  );
}
