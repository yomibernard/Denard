"use client";

import Image from "next/image";
import Link from "next/link";
import { Columns2, ClipboardList, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { cn, discountPercent, formatPrice } from "@/lib/utils";
import { useCompare, useEnquiryBasket, useWishlist } from "@/store/commerce";
import { trackEvent } from "@/lib/analytics";
import { shopImageProps } from "@/lib/shop-image";
import { useState } from "react";

export type ProductCardColour = {
  id: string;
  name: string;
  hex: string;
  slug?: string;
};

export type ProductCardImage = {
  id?: string;
  url: string;
  alt?: string | null;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnOffer?: boolean;
  availability?: string;
  images?: ProductCardImage[];
  brand?: { name: string; slug?: string } | null;
  variants?: Array<{
    colour?: ProductCardColour | null;
    size?: { id: string; name: string } | null;
    name?: string | null;
  }>;
};

export type ProductCardProps = {
  product: ProductCardData;
  className?: string;
  priority?: boolean;
};

function uniqueColours(variants: ProductCardData["variants"] = []) {
  const map = new Map<string, ProductCardColour>();
  for (const v of variants) {
    if (v.colour?.id) map.set(v.colour.id, v.colour);
  }
  return Array.from(map.values());
}

function stockLabel(availability?: string) {
  switch (availability) {
    case "LOW_STOCK":
      return "Low stock";
    case "OUT_OF_STOCK":
      return "Out of stock";
    case "PREORDER":
      return "Pre-order";
    case "MADE_TO_ORDER":
      return "Made to order";
    default:
      return null;
  }
}

/** Keep the media clean — max two badges, priority order. */
function pickBadges(product: ProductCardData, pct: number | null) {
  const badges: Array<{ key: string; variant: "sale" | "new" | "bestseller" | "featured" | "stock"; label: string }> =
    [];
  if (product.isOnOffer || pct) badges.push({ key: "sale", variant: "sale", label: "Sale" });
  if (product.isNew) badges.push({ key: "new", variant: "new", label: "New" });
  if (product.isBestSeller) badges.push({ key: "best", variant: "bestseller", label: "Best seller" });
  if (product.isFeatured) badges.push({ key: "feat", variant: "featured", label: "Featured" });
  const stock = stockLabel(product.availability);
  if (stock && badges.length < 2) {
    badges.push({ key: "stock", variant: "stock", label: stock });
  }
  return badges.slice(0, 2);
}

export function ProductCard({ product, className, priority }: ProductCardProps) {
  const toggleWish = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const toggleCompare = useCompare((s) => s.toggle);
  const comparing = useCompare((s) => s.ids.includes(product.id));
  const addItem = useEnquiryBasket((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const [needOptions, setNeedOptions] = useState(false);
  const images = product.images ?? [];
  const primary = images[0];
  const secondary = images[1];
  const colours = uniqueColours(product.variants);
  const pct = discountPercent(product.price, product.compareAtPrice);
  const currency = product.currency ?? "GBP";
  const href = `/product/${product.slug}`;
  const outOfStock = product.availability === "OUT_OF_STOCK";
  const badges = pickBadges(product, pct);

  function addToEnquiry() {
    if (outOfStock) return;
    const needsOptions = (product.variants ?? []).some(
      (v) => v.colour || v.size || (v.name && v.name.trim()),
    );
    if (needsOptions) {
      setNeedOptions(true);
      window.setTimeout(() => setNeedOptions(false), 2500);
      window.setTimeout(() => {
        window.location.href = href;
      }, 600);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku || product.slug,
      slug: product.slug,
      imageUrl: primary?.url,
      quantity: 1,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      currency,
    });
    trackEvent({ eventName: "add_to_enquiry", productId: product.id });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2800);
  }

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col bg-surface",
        outOfStock && "opacity-75",
        className,
      )}
    >
      <div className="relative overflow-hidden bg-ivory">
        <Link href={href} className="relative block product-image-ratio" aria-label={product.name}>
          {primary ? (
            <>
              <Image
                src={primary.url}
                alt={primary.alt || product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                {...shopImageProps(primary.url)}
                className={cn(
                  "object-cover object-center transition-opacity duration-500",
                  secondary && "group-hover:opacity-0",
                )}
                {...(!primary.url.startsWith("http")
                  ? {
                      placeholder: "blur" as const,
                      blurDataURL:
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWZlOGRmIi8+PC9zdmc+",
                    }
                  : {})}
              />
              {secondary ? (
                <Image
                  src={secondary.url}
                  alt={secondary.alt || `${product.name} alternate`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  {...shopImageProps(secondary.url)}
                  className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-sand text-xs text-muted">
              No image
            </div>
          )}
        </Link>

        {badges.length > 0 ? (
          <div className="absolute left-2 top-2 z-10 flex max-w-[70%] flex-col gap-1">
            {badges.map((b) => (
              <Badge key={b.key} variant={b.variant} className="w-fit">
                {b.label}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              toggleWish(product.id);
              trackEvent({
                eventName: wished ? "wishlist_remove" : "wishlist_add",
                productId: product.id,
              });
            }}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
            className={cn(
              "flex h-8 w-8 items-center justify-center",
              "bg-surface/95 text-ink-soft backdrop-blur-sm",
              "transition-colors hover:text-mint-deep",
              wished && "text-mint-deep",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", wished && "fill-current")} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(product.id)}
            aria-label={comparing ? "Remove from compare" : "Add to compare"}
            aria-pressed={comparing}
            className={cn(
              "hidden h-8 w-8 items-center justify-center sm:flex",
              "bg-surface/95 text-ink-soft backdrop-blur-sm",
              "transition-colors hover:text-mint-deep",
              comparing && "text-mint-deep",
            )}
          >
            <Columns2 className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-0 pt-3">
        {product.brand?.name ? (
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft">
            {product.brand.name}
          </p>
        ) : (
          <span className="block h-[15px]" aria-hidden />
        )}

        <Link href={href} className="block min-h-[2.5rem]">
          <h3 className="font-display text-base leading-snug text-ink transition-colors line-clamp-2 group-hover:text-mint-deep md:text-[1.1rem]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-ink">
              {formatPrice(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <span className="text-sm text-muted line-through">
                {formatPrice(product.compareAtPrice, currency)}
              </span>
            ) : null}
            {pct ? <span className="text-xs font-semibold text-amber">-{pct}%</span> : null}
          </div>

          {colours.length > 0 ? (
            <ul className="flex min-h-[14px] flex-wrap gap-1.5" aria-label="Available colours">
              {colours.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <span
                    role="img"
                    aria-label={c.name}
                    title={c.name}
                    className="block h-3 w-3 rounded-full border border-ink/15"
                    style={{ backgroundColor: c.hex }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="min-h-[14px]" aria-hidden />
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={outOfStock}
                onClick={addToEnquiry}
                className={buttonClassName({
                  variant: "primary",
                  size: "sm",
                  className: "min-w-0 flex-1 px-2",
                })}
              >
                <ClipboardList className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
                <span className="truncate">{added ? "Added" : "Enquire"}</span>
              </button>
              <Link
                href={href}
                className={buttonClassName({
                  variant: "outline",
                  size: "sm",
                  className: "min-w-0 flex-1 px-2",
                })}
              >
                View
              </Link>
            </div>
            {added ? (
              <p className="text-[11px] text-success">
                Added to enquiry.{" "}
                <Link href="/enquiry" className="underline underline-offset-2">
                  View list
                </Link>
              </p>
            ) : null}
            {needOptions ? (
              <p className="text-[11px] text-ink-soft">Choose options on the product page…</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
