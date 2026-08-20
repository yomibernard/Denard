import { prisma } from "@/lib/db";
import { CatalogueManager } from "@/components/admin/catalogue-manager";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catalogue" };

export default async function AdminCataloguePage() {
  await requireAdminPage("catalogue");
  const [departments, categories, collections, brands] = await Promise.all([
    prisma.department.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { department: { select: { name: true } } },
    }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catalogue</h1>
        <p className="mt-1 text-sm text-muted">Departments, categories, collections, and brands</p>
      </div>
      <CatalogueManager
        departments={departments}
        categories={categories}
        collections={collections}
        brands={brands}
      />
    </div>
  );
}
