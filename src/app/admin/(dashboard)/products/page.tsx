import Link from "next/link";
import { prisma } from "@/lib/db";
import type { ProductStatus } from "@/generated/prisma/client";
import { ProductsTable } from "@/components/admin/products-table";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdminPage("products");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status: status as ProductStatus } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { sku: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { brand: true, department: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} shown</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center rounded bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New product
        </Link>
      </div>

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
