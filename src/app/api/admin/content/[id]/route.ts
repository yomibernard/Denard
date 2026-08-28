import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { revalidateShopContent } from "@/lib/revalidate-shop";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("settings");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.pageContent.findUnique({ where: { id } });
  if (!existing) return jsonError("Page not found", 404);

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const pageBody = String(body.body ?? "").trim();
    if (!title || !pageBody) return jsonError("Title and body are required");

    const page = await prisma.pageContent.update({
      where: { id },
      data: {
        title,
        body: pageBody,
        seoTitle: body.seoTitle ? String(body.seoTitle).trim() : null,
        seoDescription: body.seoDescription ? String(body.seoDescription).trim() : null,
      },
    });
    revalidateShopContent([page.slug]);
    await writeAudit({
      action: "content.update",
      entityType: "PageContent",
      entityId: page.id,
      userId: session.id,
      details: { slug: page.slug },
    });
    return jsonOk({ page });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
