/**
 * Brand focus: Denard as fashion + jewellery + bags + accessories.
 * Home & Beauty stay in the catalogue for future use but leave primary surfaces.
 */

export const HIDDEN_DEPARTMENT_SLUGS = ["home-living", "beauty-care"] as const;

/** Seed / demo SKUs that dilute a fashion-house storefront when published. */
export const DILUTING_PRODUCT_SLUGS = [
  "daily-balance-moisturiser",
  "linen-throw-blanket",
  "ceramic-table-lamp",
  "classic-long-sleeve-shirt",
] as const;

export const PRIMARY_NAV_LINKS = [
  { href: "/new-arrivals", label: "New In" },
  { href: "/category/jewellery", label: "Jewellery" },
  { href: "/shop?q=bag", label: "Bags" },
  { href: "/category/women", label: "Women" },
  { href: "/category/accessories", label: "Accessories" },
  { href: "/collections", label: "Collections" },
  { href: "/style", label: "The Edit" },
] as const;

export const SECONDARY_HELP_LINKS = [
  { href: "/about", label: "Our Story" },
  { href: "/how-to-order", label: "How to Order" },
  { href: "/delivery", label: "Delivery" },
  { href: "/contact", label: "Contact" },
  { href: "/track", label: "Track Order" },
  { href: "/style", label: "The Denard Stylist" },
] as const;

export function isPrimaryDepartmentSlug(slug: string) {
  return !(HIDDEN_DEPARTMENT_SLUGS as readonly string[]).includes(slug);
}

export function filterPrimaryDepartments<T extends { slug: string }>(departments: T[]): T[] {
  return departments.filter((d) => isPrimaryDepartmentSlug(d.slug));
}
