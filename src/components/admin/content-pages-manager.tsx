"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type PageContentRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

const field =
  "w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";
const label = "mb-1 block text-xs font-medium text-ink-soft";

export function ContentPagesManager({ pages }: { pages: PageContentRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(pages[0]?.slug ?? "");
  const current = pages.find((p) => p.slug === selected) ?? pages[0];
  const [form, setForm] = useState({
    title: current?.title ?? "",
    body: current?.body ?? "",
    seoTitle: current?.seoTitle ?? "",
    seoDescription: current?.seoDescription ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function selectSlug(slug: string) {
    const page = pages.find((p) => p.slug === slug);
    setSelected(slug);
    if (page) {
      setForm({
        title: page.title,
        body: page.body,
        seoTitle: page.seoTitle ?? "",
        seoDescription: page.seoDescription ?? "",
      });
    }
    setError(null);
    setMessage(null);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/content/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setMessage("Saved");
      router.refresh();
    });
  }

  if (!pages.length) {
    return <p className="text-sm text-muted">No content pages yet. Run the database seed.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <ul className="space-y-1 rounded-lg border border-line bg-white p-2 shadow-sm">
        {pages.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => selectSlug(p.slug)}
              className={`w-full rounded px-3 py-2 text-left text-sm ${
                selected === p.slug ? "bg-accent text-white" : "hover:bg-sand"
              }`}
            >
              <span className="font-medium">{p.title}</span>
              <span className="mt-0.5 block text-[11px] opacity-70">/{p.slug}</span>
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={save} className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-sm">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <p className="text-xs text-muted">
          Editing <code className="text-[11px]">/{current?.slug}</code> — live on the storefront after save.
        </p>
        <div>
          <label className={label} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            required
            className={field}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div>
          <label className={label} htmlFor="body">
            Body
          </label>
          <textarea
            id="body"
            required
            rows={16}
            className={`${field} font-mono text-xs leading-relaxed`}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <p className="mt-1 text-[11px] text-muted">
            Plain text. For FAQ, use lines like: Q: … then A: …
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="seoTitle">
              SEO title
            </label>
            <input
              id="seoTitle"
              className={field}
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            />
          </div>
          <div>
            <label className={label} htmlFor="seoDescription">
              SEO description
            </label>
            <input
              id="seoDescription"
              className={field}
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded bg-accent px-5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save page"}
        </button>
      </form>
    </div>
  );
}
