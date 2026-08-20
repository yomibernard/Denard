"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fields: { key: string; label: string; hint?: string }[] = [
    { key: "whatsapp_phone", label: "WhatsApp phone", hint: "Digits with country code, e.g. 447887539426" },
    { key: "business_name", label: "Business name" },
    { key: "business_email", label: "Business email" },
    { key: "business_phone", label: "Business phone" },
    { key: "business_address", label: "Business address" },
    { key: "service_hours", label: "Service hours" },
    { key: "response_time", label: "Response time note" },
    { key: "currency", label: "Currency" },
  ];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setMessage("Settings saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-lg border border-line bg-white p-5 shadow-sm">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor={f.key}>
            {f.label}
          </label>
          <input
            id={f.key}
            className="h-9 w-full rounded border border-line px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
          {f.hint ? <p className="mt-1 text-[11px] text-muted">{f.hint}</p> : null}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
