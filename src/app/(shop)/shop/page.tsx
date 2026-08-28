import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { listProducts } from "@/lib/catalogue";
import { parseProductListParams } from "@/lib/plp";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Shop all",
  description: "Browse the full Denard catalogue and enquire on WhatsApp.",
  path: "/shop",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseProductListParams(sp, { sort: "newest" });
  const result = await listProducts(params);

  return (
    <ProductListing
      title="Shop all"
      description="Explore the Denard catalogue — filter by colour, size, brand and more, then enquire on WhatsApp."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname="/shop"
      searchParams={sp}
    />
  );
}
