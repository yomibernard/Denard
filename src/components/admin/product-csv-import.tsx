"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ProductCsvImport() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishImmediately, setPublishImmediately] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      if (publishImmediately) form.append("publishImmediately", "true");
      const res = await fetch("/api/admin/products/import", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setMessage(
        `Imported: ${data.created ?? 0} created, ${data.updated ?? 0} updated` +
          (publishImmediately ? " · published live" : " · left as draft (unless CSV set status)") +
          (data.errors?.length ? ` · ${data.errors.length} row errors` : ""),
      );
      router.refresh();
    });
    e.target.value = "";
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">CSV import</h2>
      <p className="mt-1 text-xs text-muted">
        Upsert by SKU. Required columns: sku, name, price.{" "}
        <a href="/api/admin/products/import" className="text-accent hover:underline">
          Download template
        </a>
      </p>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={publishImmediately}
          onChange={(e) => setPublishImmediately(e.target.checked)}
        />
        <span>
          <span className="font-medium">Publish imported products immediately</span>
          <span className="mt-0.5 block text-xs text-muted">
            Tick this to put every row live on the shop after upload — no developer needed. Leave
            unticked to keep them as drafts until you publish each one.
          </span>
        </span>
      </label>
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={pending}
        onChange={onFile}
        className="mt-3 block w-full text-sm"
      />
      {message ? <p className="mt-2 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
