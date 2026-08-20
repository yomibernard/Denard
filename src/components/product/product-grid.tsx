import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
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
        <p className="py-16 text-center text-sm text-muted">No products found.</p>
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
