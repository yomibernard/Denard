import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = new Set(["NEW", "IN_PROGRESS", "DONE", "REJECTED"]);

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("settings");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.privacyRequest.findUnique({ where: { id } });
  if (!existing) return jsonError("Not found", 404);

  try {
    const body = await request.json();
    const status = body.status != null ? String(body.status).trim().toUpperCase() : existing.status;
    if (!STATUSES.has(status)) {
      return jsonError("Status must be NEW, IN_PROGRESS, DONE or REJECTED");
    }
    const notes =
      body.notes !== undefined
        ? body.notes
          ? String(body.notes).slice(0, 4000)
          : null
        : undefined;

    const updated = await prisma.privacyRequest.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined
          ? {
              details: notes
                ? existing.details
                  ? `${existing.details}\n\n— Staff note —\n${notes}`
                  : `— Staff note —\n${notes}`
                : existing.details,
            }
          : {}),
        resolvedAt: status === "DONE" || status === "REJECTED" ? new Date() : null,
      },
    });

    await writeAudit({
      action: "privacy.update",
      entityType: "PrivacyRequest",
      entityId: id,
      userId: session.id,
      details: { status },
    });

    return jsonOk({ request: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
