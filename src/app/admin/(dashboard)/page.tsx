import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [
    productCount,
    activeCount,
    oosCount,
    lowStockCount,
    newEnquiries,
    topProducts,
    recentEnquiries,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { availability: "OUT_OF_STOCK" } }),
    prisma.product.count({
      where: {
        status: { not: "ARCHIVED" },
        OR: [{ availability: "LOW_STOCK" }, { stockQty: { lte: 5, not: null } }],
      },
    }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.product.findMany({
      where: { enquiryCount: { gt: 0 } },
      orderBy: { enquiryCount: "desc" },
      take: 5,
      select: { id: true, name: true, sku: true, enquiryCount: true, price: true },
    }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { take: 1 } },
    }),
  ]);

  const stats = [
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Published", value: activeCount, href: "/admin/products?status=PUBLISHED" },
    { label: "Low stock", value: lowStockCount, href: "/admin/products?stock=low" },
    { label: "Out of stock", value: oosCount, href: "/admin/products?stock=oos" },
    { label: "New enquiries", value: newEnquiries, href: "/admin/enquiries?status=NEW" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Catalogue and enquiry overview</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border border-line bg-white px-4 py-4 shadow-sm transition hover:border-accent"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Top enquired products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Enquiries</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted">
                      No enquiry data yet
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p) => (
                    <tr key={p.id} className="border-t border-line">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-accent">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted">{p.sku}</p>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{p.enquiryCount}</td>
                      <td className="px-4 py-2.5 tabular-nums">{formatPrice(p.price)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Recent enquiries</h2>
            <Link href="/admin/enquiries" className="text-xs font-medium text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Ref</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentEnquiries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      No enquiries yet
                    </td>
                  </tr>
                ) : (
                  recentEnquiries.map((e) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/enquiries/${e.id}`} className="font-medium hover:text-accent">
                          {e.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">{e.customerName}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                          {e.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{formatPrice(e.estimatedTotal, e.currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
