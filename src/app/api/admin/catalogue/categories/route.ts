import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import { revalidateShopTaxonomy } from "@/lib/revalidate-shop";

export async function POST(request: Request) {
  const session = await requireAdmin("catalogue");
  if (!isSession(session)) return session;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return jsonError("Name is required");
    const slug = String(body.slug ?? slugify(name)).trim() || slugify(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description) : null,
        departmentId: body.departmentId || null,
        parentId: body.parentId || null,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : 0,
        active: body.active != null ? Boolean(body.active) : true,
        featured: Boolean(body.featured),
      },
    });
    revalidateShopTaxonomy();
    return jsonOk({ category }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    if (message.includes("Unique constraint")) return jsonError("Slug already exists", 409);
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin("catalogue");
  if (!isSession(session)) return session;

  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    if (!id) return jsonError("id required");

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name != null ? String(body.name).trim() : undefined,
        slug: body.slug != null ? String(body.slug).trim() : undefined,
        description:
          body.description !== undefined
            ? body.description
              ? String(body.description)
              : null
            : undefined,
        departmentId: body.departmentId !== undefined ? body.departmentId || null : undefined,
        parentId: body.parentId !== undefined ? body.parentId || null : undefined,
        sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
        active: body.active != null ? Boolean(body.active) : undefined,
        featured: body.featured != null ? Boolean(body.featured) : undefined,
      },
    });
    revalidateShopTaxonomy();
    return jsonOk({ category });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
