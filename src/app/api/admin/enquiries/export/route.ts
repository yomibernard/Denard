import { prisma } from "@/lib/db";
import { isSession, requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await requireAdmin("enquiries");
  if (!isSession(session)) return session;

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, assignedTo: { select: { name: true, email: true } } },
  });

  const header = [
    "reference",
    "createdAt",
    "status",
    "paymentStatus",
    "intendedAction",
    "customerName",
    "customerPhone",
    "deliveryCity",
    "deliveryCountry",
    "estimatedTotal",
    "currency",
    "note",
    "source",
    "campaign",
    "pageSource",
    "deviceType",
    "whatsappRedirected",
    "paymentMethod",
    "paymentReference",
    "amountPaid",
    "paymentDate",
    "assignedTo",
    "itemCount",
    "items",
  ];

  const rows = enquiries.map((e) => {
    const items = e.items
      .map(
        (i) =>
          `${i.productName} (${i.productSku}) x${i.quantity} @ ${i.unitPrice}` +
          [i.colourName, i.sizeName, i.variantLabel].filter(Boolean).join("/"),
      )
      .join(" | ");
    return [
      e.reference,
      e.createdAt.toISOString(),
      e.status,
      e.paymentStatus,
      e.intendedAction,
      e.customerName,
      e.customerPhone,
      e.deliveryCity,
      e.deliveryCountry,
      e.estimatedTotal,
      e.currency,
      e.note,
      e.source,
      e.campaign,
      e.pageSource,
      e.deviceType,
      e.whatsappRedirected ? "yes" : "no",
      e.paymentMethod,
      e.paymentReference,
      e.amountPaid,
      e.paymentDate?.toISOString() ?? "",
      e.assignedTo?.email ?? e.assignedTo?.name ?? "",
      e.items.length,
      items,
    ]
      .map(csvEscape)
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="denard-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
