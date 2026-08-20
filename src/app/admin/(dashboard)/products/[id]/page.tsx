import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";
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
  const [product, departments, brands, images] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.productImage.findMany({
      where: { productId: id },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/products" className="text-xs font-medium text-accent hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-sm text-muted">{product.sku}</p>
      </div>

      <ProductImageManager
        productId={product.id}
        productName={product.name}
        initialImages={images}
      />

      <ProductForm
        departments={departments}
        brands={brands}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          status: product.status,
          availability: product.availability,
          stockQty: product.stockQty,
          isNew: product.isNew,
          isFeatured: product.isFeatured,
          isBestSeller: product.isBestSeller,
          isOnOffer: product.isOnOffer,
          departmentId: product.departmentId ?? "",
          brandId: product.brandId ?? "",
        }}
      />
    </div>
  );
}
