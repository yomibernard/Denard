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
  const mergeIds = useWishlist((s) => s.mergeIds);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [hydratedShare, setHydratedShare] = useState(false);

  useEffect(() => {
    if (hydratedShare || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const shared = (params.get("ids") || params.get("share") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (shared.length) {
      mergeIds(shared);
      setShareNote(`Added ${shared.length} shared item${shared.length === 1 ? "" : "s"} to your wishlist.`);
      window.history.replaceState({}, "", "/wishlist");
    }
    setHydratedShare(true);
  }, [hydratedShare, mergeIds]);

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

  async function shareWishlist() {
    if (!ids.length) return;
    const url = `${window.location.origin}/wishlist?ids=${encodeURIComponent(ids.join(","))}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Denard wishlist", url });
        setShareNote("Wishlist shared.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Share link copied.");
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="container-denard py-8 md:py-12">
      <h1 className="font-display text-3xl md:text-4xl text-ink">Wishlist</h1>
      <p className="mt-2 text-ink-soft">Products you have saved for later.</p>
      {shareNote ? <p className="mt-2 text-sm text-accent">{shareNote}</p> : null}

      {!ids.length ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-ink">Nothing saved yet</p>
          <p className="mt-2 text-sm text-muted">
            Tap the heart on a product to build a wishlist you can share.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/shop" className={buttonClassName({ variant: "primary", size: "sm" })}>
              Explore the shop
            </Link>
            <Link href="/how-to-order" className={buttonClassName({ variant: "outline", size: "sm" })}>
              How to order
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="mt-8 space-y-3" aria-busy aria-label="Loading wishlist">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded bg-sand" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClassName({ variant: "outline", size: "sm" })}
              onClick={shareWishlist}
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
