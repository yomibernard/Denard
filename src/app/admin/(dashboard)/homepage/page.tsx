import { HomepageMerchManager } from "@/components/admin/homepage-merch-manager";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage" };

export default async function AdminHomepagePage() {
  await requireAdminPage("settings");

  const [sections, banners] = await Promise.all([
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.banner.findMany({
      where: { placement: "home_hero" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
        <p className="mt-1 text-sm text-muted">
          Toggle homepage sections and edit the hero banner copy.
        </p>
      </div>
      <HomepageMerchManager sections={sections} banners={banners} />
    </div>
  );
}
