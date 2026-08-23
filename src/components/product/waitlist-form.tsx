"use client";

import { useState } from "react";
import { buttonClassName } from "@/components/ui/button";

export function WaitlistForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setError(null);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, productId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Could not join waitlist.");
      return;
    }
    setOk(true);
  }

  if (ok) {
    return (
      <p className="mt-3 text-sm text-success">
        You’re on the waitlist for {productName}. We’ll message you on WhatsApp when it’s back.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className={buttonClassName({ variant: "outline", size: "sm" })}
        onClick={() => setOpen((v) => !v)}
      >
        Notify me when back in stock
      </button>
      {open ? (
        <form onSubmit={onSubmit} className="mt-3 space-y-2 rounded border border-line p-3">
          <input name="name" required placeholder="Your name" className="h-10 w-full rounded border border-line px-3 text-sm" />
          <input name="phone" required placeholder="WhatsApp number" className="h-10 w-full rounded border border-line px-3 text-sm" />
          <input name="email" type="email" placeholder="Email (optional)" className="h-10 w-full rounded border border-line px-3 text-sm" />
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <button type="submit" className={buttonClassName({ size: "sm" })}>
            Join waitlist
          </button>
        </form>
      ) : null}
    </div>
  );
}
