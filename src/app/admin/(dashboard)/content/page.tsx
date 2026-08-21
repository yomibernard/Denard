import { ContentPagesManager } from "@/components/admin/content-pages-manager";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content" };

export default async function AdminContentPage() {
  await requireAdminPage("settings");

  const pages = await prisma.pageContent.findMany({ orderBy: { slug: "asc" } });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-muted">
          Edit About, FAQ, Privacy, Terms, Delivery and other storefront pages.
        </p>
      </div>
      <ContentPagesManager
        pages={pages.map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
