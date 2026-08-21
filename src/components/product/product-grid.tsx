import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReactNode } from "react";

export type ProductGridProps = {
  products: ProductCardData[];
  className?: string;
  empty?: ReactNode;
  priorityCount?: number;
};

export function ProductGrid({
  products,
  className,
  empty,
  priorityCount = 4,
}: ProductGridProps) {
  if (!products.length) {
    return (
      empty ?? (
        <EmptyState
          title="No products found"
          description="Try clearing filters, browsing the full shop, or ask us on WhatsApp for a recommendation."
          actions={[
            { href: "/shop", label: "Shop all", variant: "primary" },
            { href: "/how-to-order", label: "How to order", variant: "outline" },
            { href: "/contact", label: "Contact", variant: "ghost" },
          ]}
        />
      )
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12",
        className,
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
        />
      ))}
    </div>
  );
}

/** Optional clear-filters helper for listing pages that pass query strings. */
export function ProductGridEmptyWithClear({ clearHref = "/shop" }: { clearHref?: string }) {
  return (
    <EmptyState
      title="No products match"
      description="Adjust your filters or start again from the full catalogue."
      actions={[
        { href: clearHref, label: "Clear filters", variant: "primary" },
        { href: "/shop", label: "Shop all", variant: "outline" },
        { href: "/contact", label: "Ask on WhatsApp", variant: "ghost" },
      ]}
    >
      <Link href="/how-to-order" className="mb-4 text-xs text-accent hover:underline">
        New here? See how ordering works
      </Link>
    </EmptyState>
  );
}
