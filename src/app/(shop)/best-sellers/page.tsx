import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { listProducts } from "@/lib/catalogue";
import { parseProductListParams } from "@/lib/plp";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Best sellers",
  description: "Customer favourites from the Denard catalogue.",
  path: "/best-sellers",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BestSellersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseProductListParams(sp, {
    isBestSeller: true,
    sort: sp.sort ? undefined : "popular",
  });
  const result = await listProducts(params);

  return (
    <ProductListing
      title="Best sellers"
      description="Products customers enquire about most."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Best sellers" }]}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname="/best-sellers"
      searchParams={sp}
      lockedFlags={["isBestSeller"]}
    />
  );
}
