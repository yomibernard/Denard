"use client";

import { useState } from "react";
import { buttonClassName } from "@/components/ui/button";

export function PrivacyRequestForm() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("idle");
    try {
      const res = await fetch("/api/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err");
        setMessage(json.error ?? "Could not send request.");
        return;
      }
      setStatus("ok");
      setMessage(json.message ?? "Request received.");
      form.reset();
    } catch {
      setStatus("err");
      setMessage("Network error. Try WhatsApp or email hello@denard.co.uk.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-3 rounded border border-line bg-surface p-5">
      <h2 className="font-display text-xl text-ink">Data request</h2>
      <p className="text-sm text-ink-soft">
        Use this form for access, correction or deletion under UK GDPR. We aim to reply within 30 days.
      </p>
      <label className="block text-xs font-medium text-ink-soft">
        Request type
        <select name="kind" required className="mt-1 h-10 w-full rounded border border-line px-2 text-sm">
          <option value="access">Access my data</option>
          <option value="correction">Correct my data</option>
          <option value="erasure">Delete my data</option>
          <option value="restriction">Restrict processing</option>
          <option value="complaint">Complaint</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-ink-soft">
        Name
        <input name="name" required className="mt-1 h-10 w-full rounded border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs font-medium text-ink-soft">
        Email
        <input name="email" type="email" required className="mt-1 h-10 w-full rounded border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs font-medium text-ink-soft">
        Phone (optional)
        <input name="phone" className="mt-1 h-10 w-full rounded border border-line px-3 text-sm" />
      </label>
      <label className="block text-xs font-medium text-ink-soft">
        Details
        <textarea name="details" rows={4} className="mt-1 w-full rounded border border-line px-3 py-2 text-sm" />
      </label>
      {message ? (
        <p className={status === "ok" ? "text-sm text-success" : "text-sm text-danger"}>{message}</p>
      ) : null}
      <button type="submit" className={buttonClassName({ size: "sm" })}>
        Submit request
      </button>
    </form>
  );
}
