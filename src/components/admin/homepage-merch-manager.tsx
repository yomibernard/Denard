"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Section = {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  active: boolean;
  sortOrder: number;
};

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
  placement: string;
  active: boolean;
  sortOrder: number;
};

const field =
  "h-9 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-accent";

export function HomepageMerchManager({
  sections,
  banners,
}: {
  sections: Section[];
  banners: Banner[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: banners[0]?.title ?? "",
    subtitle: banners[0]?.subtitle ?? "",
    imageUrl: banners[0]?.imageUrl ?? "",
    linkUrl: banners[0]?.linkUrl ?? "/shop",
    ctaLabel: banners[0]?.ctaLabel ?? "Shop now",
    id: banners[0]?.id ?? "",
  });

  function toggleSection(section: Section) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/homepage/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !section.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Update failed");
        return;
      }
      router.refresh();
    });
  }

  function saveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!bannerForm.id) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/homepage/banners/${bannerForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bannerForm.title,
          subtitle: bannerForm.subtitle || null,
          imageUrl: bannerForm.imageUrl,
          linkUrl: bannerForm.linkUrl || null,
          ctaLabel: bannerForm.ctaLabel || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Banner save failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Homepage sections</h2>
        <p className="mt-1 text-xs text-muted">Toggle which blocks appear on the storefront home page.</p>
        <ul className="mt-4 divide-y divide-line">
          {sections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-[11px] text-muted">{s.key}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => toggleSection(s)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  s.active ? "bg-accent text-white" : "border border-line text-muted"
                }`}
              >
                {s.active ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Hero banner</h2>
        <p className="mt-1 text-xs text-muted">
          Title and subtitle feed the homepage hero. Prefer a real photo URL for imageUrl when using CDN.
        </p>
        {bannerForm.id ? (
          <form onSubmit={saveBanner} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className={field}
              placeholder="Title"
              value={bannerForm.title}
              onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Subtitle"
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Image URL"
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Link URL"
              value={bannerForm.linkUrl}
              onChange={(e) => setBannerForm((f) => ({ ...f, linkUrl: e.target.value }))}
            />
            <input
              className={field}
              placeholder="CTA label"
              value={bannerForm.ctaLabel}
              onChange={(e) => setBannerForm((f) => ({ ...f, ctaLabel: e.target.value }))}
            />
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded bg-accent px-4 text-sm font-medium text-white sm:col-span-2 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save banner"}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted">No hero banner found. Seed the database first.</p>
        )}
      </section>
    </div>
  );
}
