import Link from "next/link";
import { prisma } from "@/lib/db";
import type { AvailabilityStatus, ProductStatus } from "@/generated/prisma/client";
import { ProductsTable } from "@/components/admin/products-table";
import { ProductCsvImport } from "@/components/admin/product-csv-import";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; stock?: string }>;
}) {
  await requireAdminPage("products");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const stock = sp.stock ?? "";

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status: status as ProductStatus } : {}),
      ...(stock === "low"
        ? {
            OR: [
              { availability: "LOW_STOCK" },
              { stockQty: { lte: 5, not: null } },
            ],
          }
        : stock === "oos"
          ? { availability: "OUT_OF_STOCK" as AvailabilityStatus }
          : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { brand: true, department: true },
  });

  const lowStockCount = await prisma.product.count({
    where: {
      status: { not: "ARCHIVED" },
      OR: [{ availability: "LOW_STOCK" }, { stockQty: { lte: 5, not: null } }],
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted">
            Create, edit photos, and publish to the live shop yourself — no technical team needed.
            {products.length ? ` · ${products.length} shown` : ""}
            {lowStockCount ? (
              <>
                {" · "}
                <Link href="/admin/products?stock=low" className="text-amber hover:underline">
                  {lowStockCount} low stock
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center rounded bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New product
        </Link>
      </div>

      <ProductCsvImport />

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU, slug…"
          className="h-9 min-w-[220px] flex-1 rounded border border-line bg-white px-3 text-sm outline-none focus:border-accent"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded border border-line bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          {["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="stock"
          defaultValue={stock}
          className="h-9 rounded border border-line bg-white px-3 text-sm"
        >
          <option value="">All stock</option>
          <option value="low">Low stock</option>
          <option value="oos">Out of stock</option>
        </select>
        <button
          type="submit"
          className="h-9 rounded border border-line bg-white px-4 text-sm font-medium hover:bg-sand"
        >
          Filter
        </button>
      </form>

      <ProductsTable products={products} />
    </div>
  );
}
