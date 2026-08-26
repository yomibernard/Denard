"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/utils";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  price: number | string;
  compareAtPrice: number | string | null;
  shortDescription: string;
  description: string;
  careInstructions: string;
  sizeGuide: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  availability: string;
  stockQty: number | string | null;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isOnOffer: boolean;
  departmentId: string;
  brandId: string;
  categoryIds: string[];
  collectionIds: string[];
  variantsText: string;
};

type Option = { id: string; name: string };

const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"];
const AVAILABILITY = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "MADE_TO_ORDER"];

const field =
  "h-9 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";
const label = "mb-1 block text-xs font-medium text-ink-soft";

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function ProductForm({
  initial,
  departments,
  brands,
  categories,
  collections,
  imageCount = 0,
}: {
  initial: ProductFormValues;
  departments: Option[];
  brands: Option[];
  categories: Option[];
  collections: Option[];
  imageCount?: number;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial.id);
  const isLive = values.status === "PUBLISHED";

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onNameBlur() {
    if (!isEdit && !values.slug && values.name) {
      set("slug", slugify(values.name));
    }
  }

  function buildPayload(statusOverride?: string) {
    const status = statusOverride ?? values.status;
    return {
      ...values,
      status,
      price: Number(values.price),
      compareAtPrice:
        values.compareAtPrice === "" || values.compareAtPrice == null
          ? null
          : Number(values.compareAtPrice),
      stockQty:
        values.stockQty === "" || values.stockQty == null ? null : Number(values.stockQty),
      departmentId: values.departmentId || null,
      brandId: values.brandId || null,
      categoryIds: values.categoryIds,
      collectionIds: values.collectionIds,
      careInstructions: values.careInstructions || null,
      sizeGuide: values.sizeGuide || null,
      metaTitle: values.metaTitle || null,
      metaDescription: values.metaDescription || null,
      variantsText: values.variantsText,
    };
  }

  function save(statusOverride?: string) {
    setError(null);
    setMessage(null);
    const nextStatus = statusOverride ?? values.status;
    if (nextStatus === "PUBLISHED") {
      if (!values.name.trim() || !values.sku.trim() || values.price === "") {
        setError("Name, SKU and price are required before publishing.");
        return;
      }
      if (imageCount < 1 && isEdit) {
        const ok = confirm(
          "This product has no photos yet. Publish anyway? Customers will see a blank image until you upload one.",
        );
        if (!ok) return;
      }
    }

    startTransition(async () => {
      const payload = buildPayload(statusOverride);
      const res = await fetch(
        isEdit ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (statusOverride) set("status", statusOverride);
      const id = data.product?.id ?? initial.id;
      if (nextStatus === "PUBLISHED") {
        setMessage("Live on the shop. Customers can see and enquire about this product now.");
      } else {
        setMessage("Saved as draft. Use “Save & publish” when you are ready to go live.");
      }
      router.push(`/admin/products/${id}`);
      router.refresh();
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    save();
  }

  async function archive() {
    if (!initial.id || !confirm("Archive this product? It will leave the live shop.")) return;
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    }
  }

  async function unpublish() {
    if (!confirm("Unpublish? The product will leave the live shop until you publish again.")) return;
    save("DRAFT");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {isLive ? (
        <div className="rounded-lg border border-accent/40 bg-mint-soft/50 px-4 py-3 text-sm">
          <p className="font-semibold text-ink">Live on the shop</p>
          <p className="mt-1 text-xs text-ink-soft">
            Edits and image changes apply immediately — no developer needed. Use Unpublish to take it
            offline.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded border border-accent/30 bg-mint-soft/40 px-3 py-2 text-sm text-ink">{message}</p>
      ) : null}

      <div className="rounded-lg border border-line bg-mint-soft/40 p-4 text-sm">
        <p className="font-semibold text-ink">Go-live checklist</p>
        <ul className="mt-2 space-y-1 text-xs text-ink-soft">
          <li className={values.name && values.sku && values.price !== "" ? "text-success" : ""}>
            {values.name && values.sku && values.price !== "" ? "✓" : "○"} Name, SKU and price set
          </li>
          <li className={values.shortDescription.trim() ? "text-success" : ""}>
            {values.shortDescription.trim() ? "✓" : "○"} Short description written
          </li>
          <li className={values.departmentId || values.categoryIds.length ? "text-success" : ""}>
            {values.departmentId || values.categoryIds.length ? "✓" : "○"} Department or categories selected
          </li>
          <li className={imageCount > 0 ? "text-success" : ""}>
            {imageCount > 0 ? "✓" : "○"} At least one photo uploaded ({imageCount} on file)
          </li>
          <li className={values.availability !== "OUT_OF_STOCK" || values.status !== "PUBLISHED" ? "text-success" : "text-amber"}>
            {values.status === "PUBLISHED" && values.availability === "OUT_OF_STOCK"
              ? "! Published but marked out of stock — customers may still see it as unavailable"
              : "✓ Availability matches stock"}
          </li>
        </ul>
      </div>

      <div className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="name">Name</label>
          <input id="name" required className={field} value={values.name} onChange={(e) => set("name", e.target.value)} onBlur={onNameBlur} />
        </div>
        <div>
          <label className={label} htmlFor="slug">Slug</label>
          <input id="slug" required className={field} value={values.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="sku">SKU / reference</label>
          <input id="sku" required className={field} value={values.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="price">Price (GBP)</label>
          <input id="price" required type="number" min={0} step="0.01" className={field} value={values.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="compareAtPrice">Compare-at price</label>
          <input id="compareAtPrice" type="number" min={0} step="0.01" className={field} value={values.compareAtPrice ?? ""} onChange={(e) => set("compareAtPrice", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="status">Status</label>
          <select id="status" className={field} value={values.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <p className="mt-1 text-[11px] text-muted">Or use the Publish button below — no tech team required.</p>
        </div>
        <div>
          <label className={label} htmlFor="availability">Availability</label>
          <select id="availability" className={field} value={values.availability} onChange={(e) => set("availability", e.target.value)}>
            {AVAILABILITY.map((s) => (<option key={s} value={s}>{s.replace(/_/g, " ")}</option>))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="stockQty">Stock qty</label>
          <input id="stockQty" type="number" min={0} className={field} value={values.stockQty ?? ""} onChange={(e) => set("stockQty", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="departmentId">Department</label>
          <select id="departmentId" className={field} value={values.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
            <option value="">None</option>
            {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="brandId">Brand</label>
          <select id="brandId" className={field} value={values.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">None</option>
            {brands.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="shortDescription">Short description</label>
          <textarea id="shortDescription" rows={2} className="w-full rounded border border-line bg-white px-3 py-2 text-sm" value={values.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="description">Description</label>
          <textarea id="description" rows={5} className="w-full rounded border border-line bg-white px-3 py-2 text-sm" value={values.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Merchandising</h2>
        <p className="mt-1 text-xs text-muted">
          Categories and collections control where the product appears. Create new ones under{" "}
          <a href="/admin/catalogue" className="text-accent hover:underline">Catalogue</a>.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className={label}>Categories</legend>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-line p-2">
              {categories.length === 0 ? (
                <p className="text-xs text-muted">No categories yet. Create them under Catalogue.</p>
              ) : (
                categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={values.categoryIds.includes(c.id)} onChange={() => set("categoryIds", toggleId(values.categoryIds, c.id))} />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Collections</legend>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-line p-2">
              {collections.length === 0 ? (
                <p className="text-xs text-muted">No collections yet. Create them under Catalogue.</p>
              ) : (
                collections.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={values.collectionIds.includes(c.id)} onChange={() => set("collectionIds", toggleId(values.collectionIds, c.id))} />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </fieldset>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {([["isNew", "New"], ["isFeatured", "Featured"], ["isBestSeller", "Best seller"], ["isOnOffer", "On offer"]] as const).map(([key, text]) => (
            <label key={key} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={values[key]} onChange={(e) => set(key, e.target.checked)} />
              {text}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Variants (optional)</h2>
        <p className="mt-1 text-xs text-muted">
          One variant per line: SKU | Style name | Colour | Size | Price
        </p>
        <textarea
          rows={5}
          className="mt-3 w-full rounded border border-line bg-white px-3 py-2 font-mono text-xs"
          placeholder={"DEN-EAR-01-G | Classic | Gold | One Size | 45"}
          value={values.variantsText}
          onChange={(e) => set("variantsText", e.target.value)}
        />
      </div>

      <div className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="care">Care instructions</label>
          <textarea id="care" rows={3} className="w-full rounded border border-line bg-white px-3 py-2 text-sm" value={values.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="sizeGuide">Size guide</label>
          <textarea id="sizeGuide" rows={3} className="w-full rounded border border-line bg-white px-3 py-2 text-sm" value={values.sizeGuide} onChange={(e) => set("sizeGuide", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="metaTitle">SEO title</label>
          <input id="metaTitle" className={field} value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="metaDescription">SEO description</label>
          <input id="metaDescription" className={field} value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => save(isLive ? "PUBLISHED" : "DRAFT")}
          className="h-10 rounded border border-line bg-white px-5 text-sm font-medium hover:bg-sand disabled:opacity-60"
        >
          {pending ? "Saving…" : isLive ? "Save changes" : isEdit ? "Save draft" : "Create as draft"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => save("PUBLISHED")}
          className="h-10 rounded bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Publishing…" : isLive ? "Save & keep live" : "Save & publish (go live)"}
        </button>
        {isEdit && isLive ? (
          <button
            type="button"
            disabled={pending}
            onClick={unpublish}
            className="h-10 rounded border border-line px-4 text-sm hover:bg-sand disabled:opacity-60"
          >
            Unpublish
          </button>
        ) : null}
        {isEdit ? (
          <button type="button" onClick={archive} className="h-10 rounded border border-line px-4 text-sm text-danger hover:bg-sand">
            Archive
          </button>
        ) : null}
      </div>
    </form>
  );
}
