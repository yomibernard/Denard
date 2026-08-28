"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  kind: string;
  name: string;
  email: string;
  phone: string | null;
  details: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
};

const STATUSES = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"] as const;

export function PrivacyRequestsTable({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(initial);

  function updateStatus(id: string, status: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/privacy/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not update status");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: data.request.status,
                resolvedAt: data.request.resolvedAt,
              }
            : r,
        ),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5">When</th>
              <th className="px-4 py-2.5">Kind</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No requests yet
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="px-4 py-2.5 text-xs">
                    {new Date(r.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">{r.kind}</td>
                  <td className="px-4 py-2.5">{r.name}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {r.email}
                    {r.phone ? <div>{r.phone}</div> : null}
                    {r.details ? <p className="mt-1 text-muted whitespace-pre-wrap">{r.details}</p> : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      disabled={pending}
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="h-8 rounded border border-line bg-white px-2 text-xs outline-none focus:border-accent"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
