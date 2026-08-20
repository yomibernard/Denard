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
  status: string;
  availability: string;
  stockQty: number | string | null;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isOnOffer: boolean;
  departmentId: string;
  brandId: string;
};

type Option = { id: string; name: string };

const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"];
const AVAILABILITY = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "MADE_TO_ORDER"];

const field =
  "h-9 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15";
const label = "mb-1 block text-xs font-medium text-ink-soft";

export function ProductForm({
  initial,
  departments,
  brands,
}: {
  initial: ProductFormValues;
  departments: Option[];
  brands: Option[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initial.id);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onNameBlur() {
    if (!isEdit && !values.slug && values.name) {
      set("slug", slugify(values.name));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        ...values,
        price: Number(values.price),
        compareAtPrice:
          values.compareAtPrice === "" || values.compareAtPrice == null
            ? null
            : Number(values.compareAtPrice),
        stockQty:
          values.stockQty === "" || values.stockQty == null ? null : Number(values.stockQty),
        departmentId: values.departmentId || null,
        brandId: values.brandId || null,
      };

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
      const id = data.product?.id ?? initial.id;
      router.push(`/admin/products/${id}`);
      router.refresh();
    });
  }

  async function archive() {
    if (!initial.id || !confirm("Archive this product?")) return;
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      {error ? (
        <p className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="grid gap-4 rounded-lg border border-line bg-white p-5 shadow-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            required
            className={field}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={onNameBlur}
          />
        </div>
        <div>
          <label className={label} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            required
            className={field}
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="sku">
            SKU
          </label>
          <input
            id="sku"
            required
            className={field}
            value={values.sku}
            onChange={(e) => set("sku", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="price">
            Price (GBP)
          </label>
          <input
            id="price"
            type="number"
            required
            min={0}
            step="1"
            className={field}
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="compareAtPrice">
            Compare-at price
          </label>
          <input
            id="compareAtPrice"
            type="number"
            min={0}
            step="1"
            className={field}
            value={values.compareAtPrice ?? ""}
            onChange={(e) => set("compareAtPrice", e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className={field}
            value={values.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="availability">
            Availability
          </label>
          <select
            id="availability"
            className={field}
            value={values.availability}
            onChange={(e) => set("availability", e.target.value)}
          >
            {AVAILABILITY.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="departmentId">
            Department
          </label>
          <select
            id="departmentId"
            className={field}
            value={values.departmentId}
            onChange={(e) => set("departmentId", e.target.value)}
          >
            <option value="">— None —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="brandId">
            Brand
          </label>
          <select
            id="brandId"
            className={field}
            value={values.brandId}
            onChange={(e) => set("brandId", e.target.value)}
          >
            <option value="">— None —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="stockQty">
            Stock qty
          </label>
          <input
            id="stockQty"
            type="number"
            className={field}
            value={values.stockQty ?? ""}
            onChange={(e) => set("stockQty", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="shortDescription">
            Short description
          </label>
          <textarea
            id="shortDescription"
            rows={2}
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            value={values.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4 sm:col-span-2">
          {(
            [
              ["isNew", "New"],
              ["isFeatured", "Featured"],
              ["isBestSeller", "Best seller"],
              ["isOnOffer", "On offer"],
            ] as const
          ).map(([key, labelText]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values[key]}
                onChange={(e) => set(key, e.target.checked)}
                className="rounded border-line"
              />
              {labelText}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={archive}
            className="h-9 rounded border border-line bg-white px-4 text-sm text-danger hover:bg-danger/5"
          >
            Archive
          </button>
        ) : null}
      </div>
    </form>
  );
}
