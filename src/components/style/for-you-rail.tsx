"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";
import {
  useEnquiryBasket,
  useRecentlyViewed,
  useStylePrefs,
  useWishlist,
} from "@/store/commerce";
import { trackEvent } from "@/lib/analytics";

type RecProduct = ProductCardData & { reason?: string };

export function ForYouRail({
  excludeId,
  title = "For you",
  flush = false,
}: {
  excludeId?: string;
  title?: string;
  flush?: boolean;
}) {
  const recent = useRecentlyViewed((s) => s.productIds);
  const wishlist = useWishlist((s) => s.ids);
  const bagItems = useEnquiryBasket((s) => s.items);
  const prefs = useStylePrefs((s) => s.prefs);
  const [products, setProducts] = useState<RecProduct[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);

  const seedKey = useMemo(() => {
    const bagIds = bagItems.map((i) => i.productId);
    return [...recent, ...wishlist, ...bagIds]
      .filter((id) => id !== excludeId)
      .slice(0, 16)
      .join(",");
  }, [recent, wishlist, bagItems, excludeId]);

  const prefsKey = useMemo(() => JSON.stringify(prefs), [prefs]);

  useEffect(() => {
    const seedIds = seedKey ? seedKey.split(",") : [];
    const excludeIds = excludeId ? [excludeId] : [];

    let cancelled = false;
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seedIds,
        excludeIds,
        prefs: JSON.parse(prefsKey) as typeof prefs,
        limit: 8,
      }),
    })
      .then((r) => r.json())
      .then((data: { products?: RecProduct[]; narrative?: string }) => {
        if (cancelled) return;
        setProducts(data.products ?? []);
        setNarrative(data.narrative ?? null);
        if (data.products?.length) {
          trackEvent({
            eventName: "style_recommend_view",
            meta: { count: data.products.length },
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setNarrative(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [seedKey, prefsKey, excludeId]);

  if (!products.length) return null;

  const body = (
    <>
      <SectionHeader
        title={title}
        subtitle={narrative ?? "Proposed from what you’ve viewed, saved and told us you like."}
        href="/style"
      />
      <div className="mt-8">
        <ProductGrid products={products} priorityCount={0} />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/style" className="text-accent hover:underline">
          Manage your style profile
        </Link>
      </p>
    </>
  );

  if (flush) {
    return <section className="py-10 md:py-12">{body}</section>;
  }

  return <section className="container-denard py-12 md:py-16">{body}</section>;
}
