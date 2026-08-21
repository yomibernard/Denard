import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/product/breadcrumbs";
import { ListingToolbar, type ListingToolbarProps } from "@/components/product/listing-toolbar";
import { ProductGrid, ProductGridEmptyWithClear } from "@/components/product/product-grid";
import type { ProductCardData } from "@/components/product/product-card";
import { buttonClassName } from "@/components/ui/button";
import { getPlpFacets } from "@/lib/catalogue";
import { buildPaginationHref, type SearchParamRecord } from "@/lib/plp";
import { cn } from "@/lib/utils";

export type ProductListingProps = {
  title: string;
  description?: string | null;
  breadcrumbs?: Crumb[];
  products: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
  pathname: string;
  searchParams: SearchParamRecord;
  lockedFlags?: ListingToolbarProps["lockedFlags"];
  empty?: ReactNode;
  className?: string;
};

export async function ProductListing({
  title,
  description,
  breadcrumbs,
  products,
  total,
  page,
  totalPages,
  pathname,
  searchParams,
  lockedFlags,
  empty,
  className,
}: ProductListingProps) {
  const facets = await getPlpFacets();

  return (
    <div className={cn("container-denard py-8 md:py-12", className)}>
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} className="mb-5" /> : null}

      <header className="mb-8 max-w-2xl md:mb-10">
        <h1 className="font-display text-3xl text-ink md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-ink-soft">{description}</p> : null}
        <p className="mt-3 text-sm text-muted">
          {total === 0 ? "No products" : `${total} product${total === 1 ? "" : "s"}`}
          {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : null}
        </p>
      </header>

      <Suspense
        fallback={<div className="mb-8 h-11 animate-pulse rounded bg-sand" aria-hidden />}
      >
        <ListingToolbar
          className="mb-8"
          lockedFlags={lockedFlags}
          colours={facets.colours}
          sizes={facets.sizes}
          brands={facets.brands}
        />
      </Suspense>

      <ProductGrid
        products={products}
        empty={empty ?? <ProductGridEmptyWithClear clearHref={pathname} />}
      />

      {totalPages > 1 ? (
        <nav
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
          aria-label="Pagination"
        >
          {page > 1 ? (
            <Link
              href={buildPaginationHref(pathname, searchParams, page - 1)}
              className={buttonClassName({ variant: "outline", size: "sm" })}
              rel="prev"
            >
              Previous
            </Link>
          ) : null}
          <span className="px-3 text-sm text-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildPaginationHref(pathname, searchParams, page + 1)}
              className={buttonClassName({ variant: "outline", size: "sm" })}
              rel="next"
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
