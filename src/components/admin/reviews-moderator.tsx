"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ReviewRow = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  createdAt: string;
  product: { id: string; name: string; sku: string };
};

export function ReviewsModerator({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setApproved(id: string, approved: boolean) {
    startTransition(async () => {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    startTransition(async () => {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      router.refresh();
    });
  }

  if (!reviews.length) {
    return <p className="text-sm text-muted">No reviews yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {r.product.name}{" "}
                <span className="font-mono text-xs text-muted">({r.product.sku})</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {r.authorName} · {r.rating}/5 ·{" "}
                {new Date(r.createdAt).toLocaleString("en-GB")} ·{" "}
                {r.approved ? "Approved" : "Pending"}
              </p>
              {r.title ? <p className="mt-2 text-sm font-medium">{r.title}</p> : null}
              <p className="mt-1 text-sm text-ink-soft whitespace-pre-wrap">{r.body}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {!r.approved ? (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded bg-accent px-3 py-1.5 font-medium text-white"
                  onClick={() => setApproved(r.id, true)}
                >
                  Approve
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className="rounded border border-line px-3 py-1.5"
                  onClick={() => setApproved(r.id, false)}
                >
                  Unpublish
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                className="rounded border border-line px-3 py-1.5 text-danger"
                onClick={() => remove(r.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
