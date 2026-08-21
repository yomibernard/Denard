import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  await requireAdminPage("reports");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [enquiryCount, productViews, searches, newsletterSetting, recentEvents] =
    await Promise.all([
      prisma.enquiry.count({ where: { createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({
        where: { eventName: "product_view", createdAt: { gte: since } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["searchTerm"],
        where: {
          eventName: "search",
          createdAt: { gte: since },
          searchTerm: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { searchTerm: "desc" } },
        take: 10,
      }),
      prisma.siteSetting.findUnique({ where: { key: "newsletter_emails" } }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

  const newsletterEmails = (newsletterSetting?.value ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const statusBreakdown = await prisma.enquiry.groupBy({
    by: ["status"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { status: "desc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">Last 30 days · marketing & enquiry visibility</p>
        </div>
        <Link
          href="/api/admin/newsletter/export"
          className="h-9 rounded border border-line bg-white px-4 text-sm font-medium leading-9 hover:bg-sand"
        >
          Export newsletter CSV
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-muted">Enquiries</p>
          <p className="mt-1 text-2xl font-semibold">{enquiryCount}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-muted">Product views</p>
          <p className="mt-1 text-2xl font-semibold">{productViews}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-muted">Newsletter subscribers</p>
          <p className="mt-1 text-2xl font-semibold">{newsletterEmails.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Enquiry status</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {statusBreakdown.length === 0 ? (
              <li className="text-muted">No enquiries yet</li>
            ) : (
              statusBreakdown.map((row) => (
                <li key={row.status} className="flex justify-between gap-3">
                  <span>{row.status.replace(/_/g, " ")}</span>
                  <span className="font-medium">{row._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Top search terms</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {searches.length === 0 ? (
              <li className="text-muted">No searches tracked yet</li>
            ) : (
              searches.map((row) => (
                <li key={row.searchTerm ?? "?"} className="flex justify-between gap-3">
                  <span className="truncate">{row.searchTerm}</span>
                  <span className="font-medium">{row._count._all}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Newsletter list</h2>
        {newsletterEmails.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No subscribers yet.</p>
        ) : (
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
            {newsletterEmails.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Event</th>
              <th className="px-4 py-2.5 font-medium">Path</th>
              <th className="px-4 py-2.5 font-medium">Search</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents.map((ev) => (
              <tr key={ev.id} className="border-t border-line">
                <td className="px-4 py-2 text-xs text-muted">
                  {format(ev.createdAt, "dd MMM HH:mm")}
                </td>
                <td className="px-4 py-2">{ev.eventName}</td>
                <td className="px-4 py-2 text-xs">{ev.path ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{ev.searchTerm ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
