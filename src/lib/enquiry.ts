import { prisma } from "@/lib/db";

export async function generateEnquiryReference() {
  const year = new Date().getFullYear();
  const prefix = `DEN-${year}-`;
  const latest = await prisma.enquiry.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });

  let next = 1;
  if (latest?.reference) {
    const part = latest.reference.split("-").pop();
    const n = Number(part);
    if (!Number.isNaN(n)) next = n + 1;
  }

  return `${prefix}${String(next).padStart(6, "0")}`;
}
