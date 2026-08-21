import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.productReview.findUnique({ where: { id } });
  if (!existing) return jsonError("Review not found", 404);

  try {
    const body = await request.json();
    const review = await prisma.productReview.update({
      where: { id },
      data: {
        approved: body.approved != null ? Boolean(body.approved) : undefined,
      },
    });
    return jsonOk({ review });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  await prisma.productReview.deleteMany({ where: { id } });
  return jsonOk({ ok: true });
}
