"use client";

import { useState } from "react";
import { buttonClassName } from "@/components/ui/button";

export function WaitlistNotifyButton({
  productId,
  pendingCount,
}: {
  productId: string;
  pendingCount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function notify() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/waitlist-notify`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json.error ?? "Could not notify waitlist.");
        return;
      }
      setMsg(`Notified ${json.notified ?? 0} customer(s).`);
    } catch {
      setMsg("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Stock waitlist</h2>
      <p className="mt-1 text-sm text-muted">
        {pendingCount} customer{pendingCount === 1 ? "" : "s"} waiting to be notified.
      </p>
      <button
        type="button"
        disabled={busy || pendingCount === 0}
        className={buttonClassName({ size: "sm", className: "mt-3" })}
        onClick={() => void notify()}
      >
        {busy ? "Sending…" : "Mark waitlist notified"}
      </button>
      {msg ? <p className="mt-2 text-xs text-muted">{msg}</p> : null}
    </section>
  );
}
