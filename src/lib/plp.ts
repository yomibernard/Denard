import type { ProductListParams } from "@/lib/catalogue";

export type SearchParamRecord = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

function boolFlag(value: string | string[] | undefined): boolean | undefined {
  const v = one(value);
  if (v === "1" || v === "true") return true;
  return undefined;
}

function num(value: string | string[] | undefined): number | undefined {
  const v = one(value);
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse URL search params into catalogue listProducts params. */
export function parseProductListParams(
  searchParams: SearchParamRecord,
  defaults: Partial<ProductListParams> = {},
): ProductListParams {
  return {
    ...defaults,
    q: one(searchParams.q) ?? defaults.q,
    sort: one(searchParams.sort) ?? defaults.sort,
    page: num(searchParams.page) ?? defaults.page ?? 1,
    pageSize: num(searchParams.pageSize) ?? defaults.pageSize,
    categorySlug:
      one(searchParams.category) ?? one(searchParams.categorySlug) ?? defaults.categorySlug,
    colour: one(searchParams.colour) ?? defaults.colour,
    size: one(searchParams.size) ?? defaults.size,
    brandSlug: one(searchParams.brand) ?? defaults.brandSlug,
    material: one(searchParams.material) ?? defaults.material,
    minPrice: num(searchParams.minPrice) ?? defaults.minPrice,
    maxPrice: num(searchParams.maxPrice) ?? defaults.maxPrice,
    availability: one(searchParams.availability) ?? defaults.availability,
    isNew: boolFlag(searchParams.isNew) ?? defaults.isNew,
    isBestSeller: boolFlag(searchParams.isBestSeller) ?? defaults.isBestSeller,
    isOnOffer: boolFlag(searchParams.isOnOffer) ?? defaults.isOnOffer,
    isFeatured: boolFlag(searchParams.isFeatured) ?? defaults.isFeatured,
  };
}

export function buildPaginationHref(
  pathname: string,
  searchParams: SearchParamRecord,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams)) {
    if (key === "page") continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
