import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { stripeConfigured } from "@/lib/stripe";
import { EnquiryUpdateForm } from "@/components/admin/enquiry-update-form";
import { EnquiryAuditLog } from "@/components/admin/enquiry-audit-log";
import { EnquiryPaymentLinkPanel } from "@/components/admin/enquiry-payment-link";
import { requireAdminPage } from "@/lib/admin-page";
import { enquiryStatusLabel } from "@/lib/enquiry-status";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function toLocalInput(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    select: { reference: true },
  });
  return { title: enquiry?.reference ?? "Enquiry" };
}

export default async function AdminEnquiryDetailPage({ params }: Props) {
  await requireAdminPage("enquiries");
  const { id } = await params;
  const [enquiry, users] = await Promise.all([
    prisma.enquiry.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        items: true,
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!enquiry) notFound();

  const phone = enquiry.customerPhone.replace(/\D/g, "");
  const waMessage = `Hello ${enquiry.customerName}, this is Denard regarding enquiry ${enquiry.reference}.`;
  const waHref = phone ? buildWhatsAppUrl(phone, waMessage) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/enquiries" className="text-xs font-medium text-accent hover:underline">
            ← Enquiries
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{enquiry.reference}</h1>
          <p className="text-sm text-muted">
            {format(enquiry.createdAt, "dd MMM yyyy HH:mm")} ·{" "}
            {enquiryStatusLabel(enquiry.status)}
            {enquiry.whatsappRedirected ? " · WhatsApp opened" : ""}
          </p>
        </div>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded bg-[#1f6b45] px-4 text-sm font-medium text-white hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp customer
          </a>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Customer</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Name</dt>
                <dd className="font-medium">{enquiry.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="font-medium">{enquiry.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Delivery city</dt>
                <dd>{enquiry.deliveryCity ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Delivery country</dt>
                <dd>{enquiry.deliveryCountry ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Intended action</dt>
                <dd>{enquiry.intendedAction.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Device</dt>
                <dd>{enquiry.deviceType}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Source</dt>
                <dd>{enquiry.source ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Page source</dt>
                <dd className="truncate text-xs">{enquiry.pageSource ?? "—"}</dd>
              </div>
              {enquiry.note ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Customer note</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{enquiry.note}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Payment readiness</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Payment status</dt>
                <dd>{enquiry.paymentStatus.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Method</dt>
                <dd>{enquiry.paymentMethod ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Reference</dt>
                <dd>{enquiry.paymentReference ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Amount paid</dt>
                <dd>
                  {enquiry.amountPaid != null
                    ? formatPrice(enquiry.amountPaid, enquiry.currency)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Payment date</dt>
                <dd>
                  {enquiry.paymentDate
                    ? format(enquiry.paymentDate, "dd MMM yyyy HH:mm")
                    : "—"}
                </dd>
              </div>
              {enquiry.paymentLinkUrl ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Payment link</dt>
                  <dd>
                    <a
                      href={enquiry.paymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-accent hover:underline"
                    >
                      {enquiry.paymentLinkUrl}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Selected products</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8faf9] text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium">Line</th>
                </tr>
              </thead>
              <tbody>
                {enquiry.items.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted">
                        {item.productSku}
                        {item.colourName ? ` · ${item.colourName}` : ""}
                        {item.sizeName ? ` · ${item.sizeName}` : ""}
                        {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                      </p>
                      {item.productUrl ? (
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          View product
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatPrice(item.unitPrice, enquiry.currency)}
                      {item.compareAtPrice != null && item.compareAtPrice > item.unitPrice ? (
                        <span className="ml-1 text-xs text-muted line-through">
                          {formatPrice(item.compareAtPrice, enquiry.currency)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {formatPrice(item.lineTotal, enquiry.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-line px-4 py-3 text-right text-sm font-semibold">
              Estimated total: {formatPrice(enquiry.estimatedTotal, enquiry.currency)}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <EnquiryPaymentLinkPanel
            enquiryId={enquiry.id}
            paymentLinkUrl={enquiry.paymentLinkUrl}
            stripeConfigured={stripeConfigured()}
            estimatedTotalLabel={formatPrice(enquiry.estimatedTotal, enquiry.currency)}
          />
          <EnquiryUpdateForm
            enquiryId={enquiry.id}
            status={enquiry.status}
            internalNotes={enquiry.internalNotes ?? ""}
            assignedToId={enquiry.assignedToId ?? ""}
            paymentStatus={enquiry.paymentStatus}
            paymentMethod={enquiry.paymentMethod ?? ""}
            paymentReference={enquiry.paymentReference ?? ""}
            amountPaid={enquiry.amountPaid != null ? String(enquiry.amountPaid) : ""}
            paymentDate={toLocalInput(enquiry.paymentDate)}
            users={users}
          />
          <EnquiryAuditLog enquiryId={enquiry.id} />
        </div>
      </div>
    </div>
  );
}
