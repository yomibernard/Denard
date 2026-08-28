import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductEditor } from "@/components/admin/product-editor";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdminPage("products");
  const [departments, brands, categories, collections] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/products" className="text-xs font-medium text-accent hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New product</h1>
        <p className="mt-1 text-sm text-muted">
          Add product details, upload a photo, and the shop publishes automatically when everything
          is ready — no developer needed.
        </p>
      </div>
      <ProductEditor
        mode="create"
        productName=""
        productSlug=""
        initialStatus="DRAFT"
        initialImages={[]}
        siteUrl={siteUrl}
        departments={departments}
        brands={brands}
        categories={categories}
        collections={collections}
        formInitial={{
          name: "",
          slug: "",
          sku: "",
          price: "",
          compareAtPrice: "",
          shortDescription: "",
          description: "",
          careInstructions: "",
          sizeGuide: "",
          metaTitle: "",
          metaDescription: "",
          status: "DRAFT",
          availability: "IN_STOCK",
          stockQty: "",
          isNew: false,
          isFeatured: false,
          isBestSeller: false,
          isOnOffer: false,
          departmentId: "",
          brandId: "",
          categoryIds: [],
          collectionIds: [],
          variantsText: "",
        }}
      />
    </div>
  );
}
