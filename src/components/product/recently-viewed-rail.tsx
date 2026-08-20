"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductCardData } from "@/components/product/product-card";
import { SectionHeader } from "@/components/home/section-header";
import { useRecentlyViewed } from "@/store/commerce";

export function RecentlyViewedRail({
  excludeId,
  title = "Recently viewed",
  flush = false,
}: {
  excludeId?: string;
  title?: string;
  /** Skip outer container when already inside a container-denard parent */
  flush?: boolean;
}) {
  const ids = useRecentlyViewed((s) => s.productIds);
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    const filtered = ids.filter((id) => id !== excludeId).slice(0, 8);
    if (!filtered.length) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/products?ids=${filtered.join(",")}`)
      .then((r) => r.json())
      .then((data: { products?: ProductCardData[] }) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ids, excludeId]);

  if (!products.length) return null;

  const body = (
    <>
      <SectionHeader title={title} subtitle="Pick up where you left off." href="/shop" />
      <div className="mt-8">
        <ProductGrid products={products} priorityCount={0} />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/wishlist" className="text-accent hover:underline">
          View wishlist
        </Link>
      </p>
    </>
  );

  if (flush) {
    return <section className="py-10 md:py-12">{body}</section>;
  }

  return <section className="container-denard py-12 md:py-16">{body}</section>;
}
