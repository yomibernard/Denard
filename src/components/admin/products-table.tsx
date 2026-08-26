"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  price: number;
  status: string;
  availability: string;
  stockQty: number | null;
  brand: { name: string } | null;
  department: { name: string } | null;
};

export function ProductActions({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function duplicate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.product?.id) {
        router.push(`/admin/products/${data.product.id}`);
        router.refresh();
      } else {
        alert(data.error ?? "Duplicate failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!confirm("Publish this product to the live shop now?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Publish failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status !== "PUBLISHED" && status !== "ARCHIVED" ? (
        <button
          type="button"
          disabled={busy}
          onClick={publish}
          className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
        >
          {busy ? "…" : "Publish"}
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={duplicate}
        className="text-xs font-medium text-muted hover:underline disabled:opacity-50"
      >
        {busy ? "…" : "Duplicate"}
      </button>
    </div>
  );
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Product</th>
            <th className="px-4 py-2.5 font-medium">SKU</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Stock</th>
            <th className="px-4 py-2.5 font-medium">Price</th>
            <th className="px-4 py-2.5 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted">
                No products found
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-accent">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {[p.brand?.name, p.department?.name].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      p.status === "PUBLISHED"
                        ? "rounded bg-mint-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent"
                        : "rounded bg-sand px-1.5 py-0.5 text-[11px] font-medium"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <span
                    className={
                      p.availability === "OUT_OF_STOCK"
                        ? "font-semibold text-danger"
                        : p.availability === "LOW_STOCK" ||
                            (p.stockQty != null && p.stockQty > 0 && p.stockQty <= 5)
                          ? "font-medium text-amber"
                          : ""
                    }
                  >
                    {p.availability.replace(/_/g, " ")}
                  </span>
                  {p.stockQty != null ? (
                    <span className="mt-0.5 block text-muted">
                      Qty {p.stockQty}
                      {p.stockQty <= 5 && p.availability !== "OUT_OF_STOCK" ? " · restock soon" : ""}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    maximumFractionDigits: 2,
                  }).format(p.price)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/products/${p.id}`} className="text-xs font-medium hover:text-accent">
                      Edit
                    </Link>
                    <ProductActions productId={p.id} status={p.status} />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
