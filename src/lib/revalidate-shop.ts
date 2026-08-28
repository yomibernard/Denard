import { revalidatePath } from "next/cache";

/** Invalidate storefront caches after catalogue / content changes. */
export function revalidateShopCatalogue(opts?: { productSlug?: string | null }) {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/new-arrivals");
    revalidatePath("/best-sellers");
    revalidatePath("/offers");
    revalidatePath("/collections");
    revalidatePath("/sitemap.xml");
    if (opts?.productSlug) {
      revalidatePath(`/product/${opts.productSlug}`);
    }
  } catch {
    /* revalidate may fail outside request context — ignore */
  }
}

export function revalidateShopContent(slugs: string[] = []) {
  try {
    revalidatePath("/", "layout");
    for (const slug of slugs) {
      revalidatePath(`/${slug}`);
    }
  } catch {
    /* ignore */
  }
}

export function revalidateShopTaxonomy() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/collections");
  } catch {
    /* ignore */
  }
}
