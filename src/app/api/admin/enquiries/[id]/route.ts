import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import type { EnquiryStatus, PaymentStatus } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("enquiries");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.enquiry.findUnique({ where: { id } });
  if (!existing) return jsonError("Not found", 404);

  try {
    const body = await request.json();
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        status: body.status != null ? (body.status as EnquiryStatus) : undefined,
        internalNotes:
          body.internalNotes !== undefined
            ? body.internalNotes
              ? String(body.internalNotes)
              : null
            : undefined,
        assignedToId:
          body.assignedToId !== undefined ? body.assignedToId || null : undefined,
        salesOutcome:
          body.salesOutcome !== undefined
            ? body.salesOutcome
              ? String(body.salesOutcome)
              : null
            : undefined,
        paymentStatus:
          body.paymentStatus != null ? (body.paymentStatus as PaymentStatus) : undefined,
        paymentMethod:
          body.paymentMethod !== undefined
            ? body.paymentMethod
              ? String(body.paymentMethod)
              : null
            : undefined,
        paymentReference:
          body.paymentReference !== undefined
            ? body.paymentReference
              ? String(body.paymentReference)
              : null
            : undefined,
        amountPaid:
          body.amountPaid !== undefined
            ? body.amountPaid === null || body.amountPaid === ""
              ? null
              : Number(body.amountPaid)
            : undefined,
        paymentDate:
          body.paymentDate !== undefined
            ? body.paymentDate
              ? new Date(body.paymentDate)
              : null
            : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
    return jsonOk({ enquiry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
