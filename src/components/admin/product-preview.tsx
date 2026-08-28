"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { productReadyToPublish } from "@/lib/product-publish";

export type ProductPreviewData = {
  name: string;
  slug: string;
  sku: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  shortDescription: string;
  status: string;
  availability: string;
  imageUrl?: string | null;
  imageCount: number;
};

export function ProductPreview({ product, siteUrl }: { product: ProductPreviewData; siteUrl?: string }) {
  const price = Number(product.price);
  const compare = product.compareAtPrice != null && product.compareAtPrice !== ""
    ? Number(product.compareAtPrice)
    : null;
  const ready = productReadyToPublish({
    name: product.name,
    sku: product.sku,
    price,
    imageCount: product.imageCount,
  });
  const live = product.status === "PUBLISHED";
  const shopUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/product/${product.slug || "…"}`
    : `/product/${product.slug || "…"}`;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Review before going live</h2>
          <p className="mt-1 text-xs text-muted">
            This is how customers will see the product on the shop once published.
          </p>
        </div>
        <span
          className={
            live
              ? "rounded bg-mint-soft px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent"
              : ready
                ? "rounded bg-amber/15 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber"
                : "rounded bg-sand px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted"
          }
        >
          {live ? "Live" : ready ? "Ready to publish" : "Draft — incomplete"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="relative aspect-[3/4] overflow-hidden bg-ivory">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name || "Product preview"}
              fill
              className="object-cover"
              sizes="140px"
              unoptimized={product.imageUrl.startsWith("http")}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted">
              Upload a photo to preview
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="font-display text-xl text-ink">{product.name || "Product name"}</p>
          <p className="font-semibold tabular-nums text-ink">
            {Number.isNaN(price) ? "—" : formatPrice(price)}
            {compare != null && !Number.isNaN(compare) && compare > price ? (
              <span className="ml-2 text-sm font-normal text-muted line-through">
                {formatPrice(compare)}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted">SKU {product.sku || "—"}</p>
          {product.shortDescription ? (
            <p className="text-xs text-ink-soft line-clamp-3">{product.shortDescription}</p>
          ) : (
            <p className="text-xs text-amber">Add a short description for the shop listing.</p>
          )}
          <p className="text-xs text-muted">
            Availability: {product.availability.replace(/_/g, " ")}
          </p>
          {live ? (
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium text-accent hover:underline"
            >
              View on shop →
            </a>
          ) : ready ? (
            <p className="text-xs text-success">
              Details and photo are ready — saving or uploading will publish automatically.
            </p>
          ) : (
            <ul className="text-xs text-muted">
              {!product.name.trim() || !product.sku.trim() || Number.isNaN(price) ? (
                <li>○ Name, SKU and price required</li>
              ) : null}
              {product.imageCount < 1 ? <li>○ At least one photo required</li> : null}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
