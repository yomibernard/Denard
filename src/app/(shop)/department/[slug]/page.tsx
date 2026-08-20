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
  const dept = await prisma.department.findFirst({ where: { slug, active: true } });
  if (!dept) return { title: "Department" };
  return buildPageMetadata({
    title: dept.seoTitle || dept.name,
    description: dept.seoDescription || dept.description,
    path: `/department/${slug}`,
    image: dept.imageUrl,
  });
}

export default async function DepartmentPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const dept = await prisma.department.findFirst({ where: { slug, active: true } });
  if (!dept) notFound();

  const listParams = parseProductListParams(sp, { departmentSlug: slug });
  const result = await listProducts(listParams);

  return (
    <ProductListing
      title={dept.name}
      description={dept.description}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: dept.name },
      ]}
      products={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      pathname={`/department/${slug}`}
      searchParams={sp}
    />
  );
}
