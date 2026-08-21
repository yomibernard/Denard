import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("settings");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.homepageSection.findUnique({ where: { id } });
  if (!existing) return jsonError("Section not found", 404);

  try {
    const body = await request.json();
    const section = await prisma.homepageSection.update({
      where: { id },
      data: {
        active: body.active != null ? Boolean(body.active) : undefined,
        title: body.title != null ? String(body.title).trim() : undefined,
        subtitle:
          body.subtitle !== undefined
            ? body.subtitle
              ? String(body.subtitle).trim()
              : null
            : undefined,
      },
    });
    return jsonOk({ section });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
