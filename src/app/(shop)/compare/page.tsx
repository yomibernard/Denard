"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCompare } from "@/store/commerce";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  shortDescription: string | null;
  availability: string;
  brand: { name: string } | null;
  images: Array<{ url: string; alt: string | null }>;
};

export default function ComparePage() {
  const ids = useCompare((s) => s.ids);
  const toggle = useCompare((s) => s.toggle);
  const clear = useCompare((s) => s.clear);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/products?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data: { products?: ProductRow[] }) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="container-denard py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-ink">Compare</h1>
          <p className="mt-2 text-ink-soft">Side-by-side comparison of up to four products.</p>
        </div>
        {ids.length > 0 ? (
          <button type="button" onClick={clear} className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Clear all
          </button>
        ) : null}
      </div>

      {!ids.length ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-ink">No products to compare</p>
          <p className="mt-2 text-sm text-muted">
            Add up to a few pieces from the shop, then return here to compare side by side.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/shop" className={buttonClassName({ variant: "primary", size: "sm" })}>
              Browse the shop
            </Link>
            <Link href="/wishlist" className={buttonClassName({ variant: "outline", size: "sm" })}>
              Open wishlist
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="mt-8 h-48 animate-pulse rounded bg-sand" aria-busy aria-label="Loading compare" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-28 p-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Spec
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-3 text-left align-top font-normal">
                    <div className="relative mb-3 aspect-[4/5] w-full max-w-[160px] overflow-hidden bg-sand">
                      <Image
                        src={p.images[0]?.url ?? "/images/hero.svg"}
                        alt={p.images[0]?.alt || p.name}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <Link href={`/product/${p.slug}`} className="font-display text-lg text-ink hover:text-accent">
                      {p.name}
                    </Link>
                    <button
                      type="button"
                      className="mt-2 block text-xs text-muted hover:text-danger"
                      onClick={() => toggle(p.id)}
                    >
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Brand" values={products.map((p) => p.brand?.name ?? "—")} />
              <CompareRow
                label="Price"
                values={products.map((p) => formatPrice(p.price, p.currency))}
              />
              <CompareRow
                label="Was"
                values={products.map((p) =>
                  p.compareAtPrice ? formatPrice(p.compareAtPrice, p.currency) : "—",
                )}
              />
              <CompareRow
                label="Availability"
                values={products.map((p) => p.availability.replaceAll("_", " "))}
              />
              <CompareRow
                label="Summary"
                values={products.map((p) => p.shortDescription ?? "—")}
              />
              <tr>
                <td className="border-t border-line p-3 text-xs uppercase tracking-wider text-muted">
                  Action
                </td>
                {products.map((p) => (
                  <td key={p.id} className="border-t border-line p-3">
                    <Link
                      href={`/product/${p.slug}`}
                      className={buttonClassName({ size: "sm", variant: "outline" })}
                    >
                      View
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="border-t border-line p-3 text-xs uppercase tracking-wider text-muted align-top">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={`${label}-${i}`} className="border-t border-line p-3 text-ink-soft align-top">
          {v}
        </td>
      ))}
    </tr>
  );
}
