import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import {
  parseVariantsText,
  syncProductCategories,
  syncProductCollections,
  syncProductVariants,
} from "@/lib/product-admin";
import type { AvailabilityStatus, ProductStatus } from "@/generated/prisma/client";

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

export async function GET(request: Request) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 50)));

  const where = {
    ...(status ? { status: status as ProductStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        brand: true,
        department: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return jsonOk({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return jsonError("Name is required");

    const slug = String(body.slug ?? slugify(name)).trim() || slugify(name);
    const sku = String(body.sku ?? "").trim() || `DN-${Date.now().toString(36).toUpperCase()}`;
    const price = Number(body.price);
    if (Number.isNaN(price)) return jsonError("Valid price required");

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        price,
        compareAtPrice:
          body.compareAtPrice != null && body.compareAtPrice !== ""
            ? Number(body.compareAtPrice)
            : null,
        shortDescription: body.shortDescription ? String(body.shortDescription) : null,
        description: body.description ? String(body.description) : null,
        careInstructions: body.careInstructions ? String(body.careInstructions) : null,
        sizeGuide: body.sizeGuide ? String(body.sizeGuide) : null,
        seoTitle: body.metaTitle ? String(body.metaTitle) : null,
        seoDescription: body.metaDescription ? String(body.metaDescription) : null,
        status: (body.status as ProductStatus) || "DRAFT",
        availability: (body.availability as AvailabilityStatus) || "IN_STOCK",
        stockQty: body.stockQty != null && body.stockQty !== "" ? Number(body.stockQty) : null,
        isNew: Boolean(body.isNew),
        isFeatured: Boolean(body.isFeatured),
        isBestSeller: Boolean(body.isBestSeller),
        isOnOffer: Boolean(body.isOnOffer),
        departmentId: body.departmentId || null,
        brandId: body.brandId || null,
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      },
    });

    await syncProductCategories(product.id, asIdList(body.categoryIds));
    await syncProductCollections(product.id, asIdList(body.collectionIds));
    if (typeof body.variantsText === "string" && body.variantsText.trim()) {
      await syncProductVariants(product.id, parseVariantsText(body.variantsText), price);
    }

    const full = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: true,
        collections: true,
        variants: true,
      },
    });

    return jsonOk({ product: full }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    if (message.includes("Unique constraint")) return jsonError("Slug or SKU already exists", 409);
    return jsonError(message, 500);
  }
}
