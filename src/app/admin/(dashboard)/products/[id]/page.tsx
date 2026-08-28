import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductEditor } from "@/components/admin/product-editor";
import { formatVariantsText } from "@/lib/product-admin";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product?.name ?? "Product" };
}

export default async function EditProductPage({ params }: Props) {
  await requireAdminPage("products");
  const { id } = await params;
  const [product, departments, brands, categories, collections, images, waitlistPending] =
    await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
        collections: true,
        variants: { include: { colour: true, size: true }, orderBy: { sku: "asc" } },
      },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productImage.findMany({
      where: { productId: id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.stockWaitlist.count({ where: { productId: id, notifiedAt: null } }),
  ]);
  if (!product) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/products" className="text-xs font-medium text-accent hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-sm text-muted">
          {product.sku}
          {product.status === "PUBLISHED" ? (
            <span className="ml-2 rounded bg-mint-soft px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
              Live
            </span>
          ) : (
            <span className="ml-2 rounded bg-sand px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              {product.status}
            </span>
          )}
        </p>
      </div>

      <ProductEditor
        mode="edit"
        productId={product.id}
        productName={product.name}
        productSlug={product.slug}
        initialStatus={product.status}
        initialImages={images}
        waitlistPending={waitlistPending}
        siteUrl={siteUrl}
        departments={departments}
        brands={brands}
        categories={categories}
        collections={collections}
        formInitial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          careInstructions: product.careInstructions ?? "",
          sizeGuide: product.sizeGuide ?? "",
          metaTitle: product.seoTitle ?? "",
          metaDescription: product.seoDescription ?? "",
          status: product.status,
          availability: product.availability,
          stockQty: product.stockQty,
          isNew: product.isNew,
          isFeatured: product.isFeatured,
          isBestSeller: product.isBestSeller,
          isOnOffer: product.isOnOffer,
          departmentId: product.departmentId ?? "",
          brandId: product.brandId ?? "",
          categoryIds: product.categories.map((c) => c.categoryId),
          collectionIds: product.collections.map((c) => c.collectionId),
          variantsText: formatVariantsText(product.variants),
        }}
      />
    </div>
  );
}
