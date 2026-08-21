"use client";

import { useState, useTransition } from "react";

export type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ProductReviews({
  productId,
  reviews,
  average,
  count,
}: {
  productId: string;
  reviews: ReviewItem[];
  average: number | null;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    authorName: "",
    rating: 5,
    title: "",
    body: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not submit review");
        return;
      }
      setMessage("Thanks — your review will appear after we approve it.");
      setForm({ authorName: "", rating: 5, title: "", body: "" });
      setOpen(false);
    });
  }

  return (
    <section className="mt-10 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Customer reviews</h2>
          {count > 0 && average != null ? (
            <p className="mt-1 text-sm text-ink-soft">
              <Stars rating={Math.round(average)} />{" "}
              <span className="ml-1">
                {average.toFixed(1)} · {count} review{count === 1 ? "" : "s"}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Be the first to leave a review.</p>
          )}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-accent hover:underline"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Cancel" : "Write a review"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {open ? (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded border border-line bg-ivory p-4">
          <input
            required
            placeholder="Your name"
            className="h-9 w-full rounded border border-line bg-white px-3 text-sm"
            value={form.authorName}
            onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            Rating
            <select
              className="h-9 rounded border border-line bg-white px-2 text-sm"
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <input
            placeholder="Title (optional)"
            className="h-9 w-full rounded border border-line bg-white px-3 text-sm"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            required
            rows={4}
            placeholder="Your experience with this piece"
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Sending…" : "Submit for review"}
          </button>
        </form>
      ) : null}

      <ul className="mt-6 space-y-5">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-line pb-5 last:border-0">
            <div className="flex flex-wrap items-center gap-2">
              <Stars rating={r.rating} />
              {r.title ? <p className="font-medium text-ink">{r.title}</p> : null}
            </div>
            <p className="mt-2 text-sm text-ink-soft whitespace-pre-wrap">{r.body}</p>
            <p className="mt-2 text-xs text-muted">
              {r.authorName} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
