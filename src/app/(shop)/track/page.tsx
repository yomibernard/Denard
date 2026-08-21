"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type TrackResult = {
  reference: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  estimatedTotal?: number;
  currency?: string;
};

export default function TrackPage() {
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [paidBanner, setPaidBanner] = useState<"success" | "cancel" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("reference");
    if (ref) setReference(ref);
    const paid = params.get("paid");
    if (paid === "1") setPaidBanner("success");
    if (paid === "0") setPaidBanner("cancel");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/enquiries/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enquiry not found.");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-denard py-8 md:py-12 max-w-lg">
      <h1 className="font-display text-3xl md:text-4xl text-ink">Track enquiry</h1>
      <p className="mt-2 text-ink-soft">
        Enter your enquiry reference and the phone number used when you submitted it.
      </p>
      {paidBanner === "success" ? (
        <p className="mt-4 rounded border border-accent/30 bg-mint-soft px-3 py-2 text-sm text-ink">
          Payment received — thank you. Enter your details below to confirm enquiry status, or wait
          for a WhatsApp confirmation from Denard.
        </p>
      ) : null}
      {paidBanner === "cancel" ? (
        <p className="mt-4 rounded border border-line bg-sand px-3 py-2 text-sm text-ink-soft">
          Payment was cancelled. You can try again when Denard sends a new link on WhatsApp.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="DEN-2026-000001"
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? "Checking…" : "Check status"}
        </Button>
      </form>

      {result ? (
        <div className="mt-8 rounded-[var(--denard-radius)] border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Reference</p>
          <p className="font-medium text-ink">{result.reference}</p>
          <p className="mt-4 text-xs uppercase tracking-wider text-muted">Status</p>
          <p className="font-display text-2xl text-accent">
            {result.status.replaceAll("_", " ")}
          </p>
          <dl className="mt-4 space-y-2 text-sm text-ink-soft">
            <div className="flex justify-between gap-4">
              <dt>Submitted</dt>
              <dd>{new Date(result.createdAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Updated</dt>
              <dd>{new Date(result.updatedAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Items</dt>
              <dd>{result.itemCount}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
