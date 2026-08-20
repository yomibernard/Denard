import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Crumb } from "@/components/product/breadcrumbs";
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
  const category = await prisma.category.findFirst({
    where: { slug, active: true },
    include: { department: true },
  });
  if (!category) return { title: "Category" };
  return buildPageMetadata({
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description,
    path: `/category/${slug}`,
    image: category.imageUrl,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await prisma.category.findFirst({
    where: { slug, active: true },
    include: { department: true },
  });
  if (!category) notFound();

  const listParams = parseProductListParams(sp, { categorySlug: slug });
  const result = await listProducts(listParams);

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];
  if (category.department) {
    crumbs.push({
      label: category.department.name,
      href: `/department/${category.department.slug}`,
    });
  }
  crumbs.push({ label: category.name });

  return (
    <ProductListing
      title={category.name}
      description={category.description}
      breadcrumbs={crumbs}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname={`/category/${slug}`}
      searchParams={sp}
    />
  );
}
