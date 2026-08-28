import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import {
  parseVariantsText,
  syncProductCategories,
  syncProductCollections,
  syncProductVariants,
} from "@/lib/product-admin";
import { productImageCount } from "@/lib/product-publish-server";
import { tagProductWithJewelleryCategories } from "@/lib/jewellery-taxonomy";
import type { AvailabilityStatus, ProductStatus } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ id: string }> };

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

export async function GET(_request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      department: true,
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      collections: { include: { collection: true } },
      variants: { include: { colour: true, size: true } },
    },
  });
  if (!product) return jsonError("Not found", 404);
  return jsonOk({ product });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return jsonError("Not found", 404);

    const name = body.name != null ? String(body.name).trim() : existing.name;
    const slug =
      body.slug != null ? String(body.slug).trim() || slugify(name) : existing.slug;
    const price = body.price != null ? Number(body.price) : existing.price;

    const nextStatus =
      body.status != null ? (body.status as ProductStatus) : existing.status;
    if (nextStatus === "PUBLISHED") {
      const images = await productImageCount(id);
      if (images < 1) {
        return jsonError("Upload at least one product photo before publishing.");
      }
      const sku = body.sku != null ? String(body.sku).trim() : existing.sku;
      if (!name || !sku) {
        return jsonError("Name and SKU are required before publishing.");
      }
      if (Number.isNaN(price)) {
        return jsonError("Valid price is required before publishing.");
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        sku: body.sku != null ? String(body.sku).trim() : undefined,
        price: body.price != null ? Number(body.price) : undefined,
        compareAtPrice:
          body.compareAtPrice !== undefined
            ? body.compareAtPrice === null || body.compareAtPrice === ""
              ? null
              : Number(body.compareAtPrice)
            : undefined,
        shortDescription:
          body.shortDescription !== undefined
            ? body.shortDescription
              ? String(body.shortDescription)
              : null
            : undefined,
        description:
          body.description !== undefined
            ? body.description
              ? String(body.description)
              : null
            : undefined,
        careInstructions:
          body.careInstructions !== undefined
            ? body.careInstructions
              ? String(body.careInstructions)
              : null
            : undefined,
        sizeGuide:
          body.sizeGuide !== undefined
            ? body.sizeGuide
              ? String(body.sizeGuide)
              : null
            : undefined,
        seoTitle:
          body.metaTitle !== undefined
            ? body.metaTitle
              ? String(body.metaTitle)
              : null
            : undefined,
        seoDescription:
          body.metaDescription !== undefined
            ? body.metaDescription
              ? String(body.metaDescription)
              : null
            : undefined,
        status: body.status != null ? (body.status as ProductStatus) : undefined,
        availability:
          body.availability != null ? (body.availability as AvailabilityStatus) : undefined,
        stockQty:
          body.stockQty !== undefined
            ? body.stockQty === null || body.stockQty === ""
              ? null
              : Number(body.stockQty)
            : undefined,
        isNew: body.isNew != null ? Boolean(body.isNew) : undefined,
        isFeatured: body.isFeatured != null ? Boolean(body.isFeatured) : undefined,
        isBestSeller: body.isBestSeller != null ? Boolean(body.isBestSeller) : undefined,
        isOnOffer: body.isOnOffer != null ? Boolean(body.isOnOffer) : undefined,
        departmentId:
          body.departmentId !== undefined ? body.departmentId || null : undefined,
        brandId: body.brandId !== undefined ? body.brandId || null : undefined,
        publishedAt:
          body.status === "PUBLISHED" && !existing.publishedAt ? new Date() : undefined,
      },
    });

    if (body.categoryIds !== undefined) {
      await syncProductCategories(id, asIdList(body.categoryIds));
    }
    if (body.collectionIds !== undefined) {
      await syncProductCollections(id, asIdList(body.collectionIds));
    }
    if (typeof body.variantsText === "string") {
      await syncProductVariants(id, parseVariantsText(body.variantsText), price);
    }

    if (nextStatus === "PUBLISHED") {
      if (!existing.publishedAt && !existing.isNew) {
        await prisma.product.update({ where: { id }, data: { isNew: true } });
      }
      await tagProductWithJewelleryCategories(id);
    }

    const full = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: true,
        collections: true,
        variants: { include: { colour: true, size: true } },
      },
    });

    return jsonOk({ product: full });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.includes("Unique constraint")) return jsonError("Slug or SKU already exists", 409);
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Not found", 404);

  const product = await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  return jsonOk({ product });
}
