import Link from "next/link";
import { prisma } from "@/lib/db";
import type { EnquiryStatus } from "@/generated/prisma/client";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { requireAdminPage } from "@/lib/admin-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };

const STATUSES: EnquiryStatus[] = [
  "NEW",
  "WHATSAPP_OPENED",
  "CUSTOMER_CONTACTED",
  "AVAILABILITY_CONFIRMED",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPage("enquiries");
  const sp = await searchParams;
  const status = sp.status ?? "";
  const q = (sp.q ?? "").trim();

  const [enquiries, topProducts] = await Promise.all([
    prisma.enquiry.findMany({
      where: {
        AND: [
          status ? { status: status as EnquiryStatus } : {},
          q
            ? {
                OR: [
                  { reference: { contains: q } },
                  { customerName: { contains: q } },
                  { customerPhone: { contains: q } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        assignedTo: { select: { name: true } },
        items: { select: { id: true } },
      },
    }),
    prisma.product.findMany({
      where: { enquiryCount: { gt: 0 } },
      orderBy: { enquiryCount: "desc" },
      take: 8,
      select: { id: true, name: true, sku: true, enquiryCount: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted">{enquiries.length} shown</p>
        </div>
        <a
          href="/api/admin/enquiries/export"
          className="inline-flex h-9 items-center rounded border border-line bg-white px-4 text-sm font-medium hover:bg-sand"
        >
          Export CSV
        </a>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search reference, name, phone…"
          className="h-9 min-w-[14rem] flex-1 rounded border border-line bg-white px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded border border-line bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
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

      <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Reference</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 font-medium">Items</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Payment</th>
              <th className="px-4 py-2.5 font-medium">Assigned</th>
              <th className="px-4 py-2.5 font-medium">Total</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No enquiries found
                </td>
              </tr>
            ) : (
              enquiries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/enquiries/${e.id}`} className="font-medium hover:text-accent">
                      {e.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <p>{e.customerName}</p>
                    <p className="text-xs text-muted">{e.customerPhone}</p>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{e.items.length}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
                      {e.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{e.paymentStatus.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5 text-xs">{e.assignedTo?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {formatPrice(e.estimatedTotal, e.currency)}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    {format(e.createdAt, "dd MMM yyyy HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Most requested products</h2>
        {topProducts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No enquiry product data yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {topProducts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{p.sku}</p>
                </div>
                <span className="tabular-nums text-muted">{p.enquiryCount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
