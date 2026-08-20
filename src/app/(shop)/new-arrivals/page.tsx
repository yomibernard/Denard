import type { Metadata } from "next";
import { ProductListing } from "@/components/product/product-listing";
import { listProducts } from "@/lib/catalogue";
import { parseProductListParams } from "@/lib/plp";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "New arrivals",
  description: "The latest products added to the Denard catalogue.",
  path: "/new-arrivals",
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewArrivalsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseProductListParams(sp, { isNew: true, sort: sp.sort ? undefined : "newest" });
  const result = await listProducts(params);

  return (
    <ProductListing
      title="New arrivals"
      description="Fresh pieces just added to the catalogue."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New arrivals" }]}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname="/new-arrivals"
      searchParams={sp}
      lockedFlags={["isNew"]}
    />
  );
}
