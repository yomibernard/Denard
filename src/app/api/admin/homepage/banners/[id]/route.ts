import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { revalidateShopContent } from "@/lib/revalidate-shop";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("settings");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) return jsonError("Banner not found", 404);

  try {
    const body = await request.json();
    const title = body.title != null ? String(body.title).trim() : undefined;
    const imageUrl = body.imageUrl != null ? String(body.imageUrl).trim() : undefined;
    if (title !== undefined && !title) return jsonError("Title is required");
    if (imageUrl !== undefined && !imageUrl) return jsonError("Image URL is required");

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle:
          body.subtitle !== undefined
            ? body.subtitle
              ? String(body.subtitle).trim()
              : null
            : undefined,
        imageUrl,
        linkUrl:
          body.linkUrl !== undefined
            ? body.linkUrl
              ? String(body.linkUrl).trim()
              : null
            : undefined,
        ctaLabel:
          body.ctaLabel !== undefined
            ? body.ctaLabel
              ? String(body.ctaLabel).trim()
              : null
            : undefined,
        active: body.active != null ? Boolean(body.active) : undefined,
      },
    });
    revalidateShopContent();
    return jsonOk({ banner });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
