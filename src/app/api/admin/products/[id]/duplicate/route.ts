import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const source = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      categories: true,
      collections: true,
      materials: true,
      tags: true,
    },
  });
  if (!source) return jsonError("Not found", 404);

  const suffix = Date.now().toString(36);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: `${source.name} (copy)`,
        slug: `${source.slug}-copy-${suffix}`,
        sku: `${source.sku}-COPY-${suffix}`.slice(0, 60),
        shortDescription: source.shortDescription,
        description: source.description,
        specifications: source.specifications,
        careInstructions: source.careInstructions,
        sizeGuide: source.sizeGuide,
        price: source.price,
        compareAtPrice: source.compareAtPrice,
        currency: source.currency,
        status: "DRAFT",
        availability: source.availability,
        stockQty: source.stockQty,
        isNew: source.isNew,
        isFeatured: false,
        isBestSeller: false,
        isOnOffer: source.isOnOffer,
        videoUrl: source.videoUrl,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        departmentId: source.departmentId,
        brandId: source.brandId,
      },
    });

    if (source.images.length) {
      await tx.productImage.createMany({
        data: source.images.map((img) => ({
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
          productId: created.id,
        })),
      });
    }
    if (source.categories.length) {
      await tx.productCategory.createMany({
        data: source.categories.map((c) => ({
          productId: created.id,
          categoryId: c.categoryId,
        })),
      });
    }
    if (source.collections.length) {
      await tx.productCollection.createMany({
        data: source.collections.map((c) => ({
          productId: created.id,
          collectionId: c.collectionId,
        })),
      });
    }
    if (source.materials.length) {
      await tx.productMaterial.createMany({
        data: source.materials.map((m) => ({
          productId: created.id,
          materialId: m.materialId,
        })),
      });
    }
    if (source.tags.length) {
      await tx.productTag.createMany({
        data: source.tags.map((t) => ({
          productId: created.id,
          tagId: t.tagId,
        })),
      });
    }

    return created;
  });

  return jsonOk({ product }, { status: 201 });
}
