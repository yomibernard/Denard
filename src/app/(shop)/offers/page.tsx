import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { listProducts } from "@/lib/catalogue";
import { parseProductListParams } from "@/lib/plp";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Offers",
  description: "Current offers and reduced prices from Denard.",
  path: "/offers",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OffersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseProductListParams(sp, {
    isOnOffer: true,
    sort: sp.sort ? undefined : "discount",
  });
  const result = await listProducts(params);

  return (
    <ProductListing
      title="Offers"
      description="Selected products with promotional pricing."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Offers" }]}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname="/offers"
      searchParams={sp}
      lockedFlags={["isOnOffer"]}
    />
  );
}
