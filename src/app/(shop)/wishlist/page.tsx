"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/store/commerce";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: Array<{ url: string; alt: string | null }>;
  brand: { name: string } | null;
};

export default function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const toggle = useWishlist((s) => s.toggle);
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
      <h1 className="font-display text-3xl md:text-4xl text-ink">Wishlist</h1>
      <p className="mt-2 text-ink-soft">Products you have saved for later.</p>

      {!ids.length ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted">
            Nothing saved yet.{" "}
            <Link href="/shop" className="text-accent hover:underline">
              Explore the shop
            </Link>
          </p>
        </div>
      ) : loading ? (
        <p className="py-16 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClassName({ variant: "outline", size: "sm" })}
              onClick={async () => {
                const url = typeof window !== "undefined" ? window.location.href : "/wishlist";
                try {
                  if (navigator.share) {
                    await navigator.share({ title: "My Denard wishlist", url });
                  } else {
                    await navigator.clipboard.writeText(url);
                  }
                } catch {
                  /* cancelled */
                }
              }}
            >
              Share wishlist
            </button>
          </div>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {products.map((p) => (
            <li key={p.id} className="flex gap-4 py-4">
              <Link
                href={`/product/${p.slug}`}
                className="relative h-24 w-20 shrink-0 overflow-hidden bg-sand"
              >
                <Image
                  src={p.images[0]?.url ?? "/images/hero.svg"}
                  alt={p.images[0]?.alt || p.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                {p.brand?.name ? (
                  <p className="text-[11px] uppercase tracking-wider text-muted">{p.brand.name}</p>
                ) : null}
                <Link
                  href={`/product/${p.slug}`}
                  className="font-display text-lg text-ink hover:text-accent"
                >
                  {p.name}
                </Link>
                <p className="mt-1 text-sm font-medium">
                  {formatPrice(p.price, p.currency)}
                  {p.compareAtPrice && p.compareAtPrice > p.price ? (
                    <span className="ml-2 text-muted line-through">
                      {formatPrice(p.compareAtPrice, p.currency)}
                    </span>
                  ) : null}
                </p>
                <div className="mt-2 flex gap-3">
                  <Link
                    href={`/product/${p.slug}`}
                    className={buttonClassName({ size: "sm", variant: "outline" })}
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
