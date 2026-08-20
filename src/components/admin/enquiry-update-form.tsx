"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const STATUSES = [
  "NEW",
  "WHATSAPP_OPENED",
  "CUSTOMER_CONTACTED",
  "AVAILABILITY_CONFIRMED",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
] as const;

const PAYMENT_STATUSES = ["NONE", "PENDING", "CONFIRMED", "FAILED", "REFUNDED"] as const;

type UserOpt = { id: string; name: string };

export function EnquiryUpdateForm({
  enquiryId,
  status,
  internalNotes,
  assignedToId,
  paymentStatus,
  paymentMethod,
  paymentReference,
  amountPaid,
  paymentDate,
  users,
}: {
  enquiryId: string;
  status: string;
  internalNotes: string;
  assignedToId: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentReference: string;
  amountPaid: string;
  paymentDate: string;
  users: UserOpt[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    status,
    internalNotes,
    assignedToId,
    paymentStatus,
    paymentMethod,
    paymentReference,
    amountPaid,
    paymentDate,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: values.status,
          internalNotes: values.internalNotes || null,
          assignedToId: values.assignedToId || null,
          paymentStatus: values.paymentStatus,
          paymentMethod: values.paymentMethod || null,
          paymentReference: values.paymentReference || null,
          amountPaid: values.amountPaid === "" ? null : Number(values.amountPaid),
          paymentDate: values.paymentDate || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Update enquiry</h2>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Enquiry status</label>
        <select
          className="h-9 w-full rounded border border-line px-3 text-sm"
          value={values.status}
          onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Assign to</label>
        <select
          className="h-9 w-full rounded border border-line px-3 text-sm"
          value={values.assignedToId}
          onChange={(e) => setValues((v) => ({ ...v, assignedToId: e.target.value }))}
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="border-t border-line pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Payment</p>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Payment status</label>
        <select
          className="mb-3 h-9 w-full rounded border border-line px-3 text-sm"
          value={values.paymentStatus}
          onChange={(e) => setValues((v) => ({ ...v, paymentStatus: e.target.value }))}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Payment method</label>
        <input
          className="mb-3 h-9 w-full rounded border border-line px-3 text-sm"
          value={values.paymentMethod}
          onChange={(e) => setValues((v) => ({ ...v, paymentMethod: e.target.value }))}
          placeholder="Bank transfer, cash…"
        />
        <label className="mb-1 block text-xs font-medium text-ink-soft">Payment reference</label>
        <input
          className="mb-3 h-9 w-full rounded border border-line px-3 text-sm"
          value={values.paymentReference}
          onChange={(e) => setValues((v) => ({ ...v, paymentReference: e.target.value }))}
        />
        <label className="mb-1 block text-xs font-medium text-ink-soft">Amount paid</label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="mb-3 h-9 w-full rounded border border-line px-3 text-sm"
          value={values.amountPaid}
          onChange={(e) => setValues((v) => ({ ...v, amountPaid: e.target.value }))}
        />
        <label className="mb-1 block text-xs font-medium text-ink-soft">Payment date</label>
        <input
          type="datetime-local"
          className="mb-3 h-9 w-full rounded border border-line px-3 text-sm"
          value={values.paymentDate}
          onChange={(e) => setValues((v) => ({ ...v, paymentDate: e.target.value }))}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Internal notes</label>
        <textarea
          rows={4}
          className="w-full rounded border border-line px-3 py-2 text-sm"
          value={values.internalNotes}
          onChange={(e) => setValues((v) => ({ ...v, internalNotes: e.target.value }))}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
