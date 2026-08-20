import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdminPage("products");
  const [departments, brands] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/products" className="text-xs font-medium text-accent hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New product</h1>
        <p className="mt-1 text-sm text-muted">
          Create the product first, then you will be taken to the edit page to upload images.
        </p>
      </div>
      <div className="rounded border border-line bg-canvas/80 px-4 py-3 text-sm text-ink-soft">
        After saving, use <strong className="font-medium text-ink">Product images</strong> to upload
        photos, set the main image, reorder, or add an image URL.
      </div>
      <ProductForm
        departments={departments}
        brands={brands}
        initial={{
          name: "",
          slug: "",
          sku: "",
          price: "",
          compareAtPrice: "",
          shortDescription: "",
          description: "",
          status: "DRAFT",
          availability: "IN_STOCK",
          stockQty: "",
          isNew: false,
          isFeatured: false,
          isBestSeller: false,
          isOnOffer: false,
          departmentId: "",
          brandId: "",
        }}
      />
    </div>
  );
}
