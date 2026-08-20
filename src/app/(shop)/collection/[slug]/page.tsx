import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product/product-listing";
import { listProducts } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { parseProductListParams } from "@/lib/plp";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 120;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findFirst({ where: { slug, active: true } });
  if (!collection) return { title: "Collection" };
  return buildPageMetadata({
    title: collection.seoTitle || collection.name,
    description: collection.seoDescription || collection.description,
    path: `/collection/${slug}`,
    image: collection.imageUrl,
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const collection = await prisma.collection.findFirst({ where: { slug, active: true } });
  if (!collection) notFound();

  const listParams = parseProductListParams(sp, { collectionSlug: slug });
  const result = await listProducts(listParams);

  return (
    <ProductListing
      title={collection.name}
      description={collection.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Collections", href: "/collections" },
        { label: collection.name },
      ]}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname={`/collection/${slug}`}
      searchParams={sp}
    />
  );
}
