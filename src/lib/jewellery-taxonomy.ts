import { prisma } from "@/lib/db";

const JEWELLERY_NAME =
  /\b(earring|earrings|necklace|bracelet|jewell?ery|hoop|pendant|chain|zirconia|pearl|stud|brooch|anklet|ring set|jewellery set)\b/i;

/** Ensure Accessories + Jewellery categories exist under Fashion. */
export async function ensureJewelleryTaxonomy() {
  let fashion = await prisma.department.findUnique({ where: { slug: "fashion" } });
  if (!fashion) {
    fashion = await prisma.department.create({
      data: {
        name: "Fashion",
        slug: "fashion",
        description: "Refined fashion and accessories.",
        featured: true,
        sortOrder: 1,
        active: true,
      },
    });
  }

  let accessories = await prisma.category.findUnique({ where: { slug: "accessories" } });
  if (!accessories) {
    accessories = await prisma.category.create({
      data: {
        name: "Accessories",
        slug: "accessories",
        description: "Jewellery and finishing pieces curated by Denard.",
        departmentId: fashion.id,
        featured: true,
        sortOrder: 10,
        active: true,
        seoTitle: "Accessories | Denard",
        seoDescription: "Shop Denard accessories and finishing pieces.",
      },
    });
  } else {
    await prisma.category.update({
      where: { id: accessories.id },
      data: { active: true, featured: true, departmentId: fashion.id },
    });
  }

  let jewellery = await prisma.category.findUnique({ where: { slug: "jewellery" } });
  if (!jewellery) {
    jewellery = await prisma.category.create({
      data: {
        name: "Jewellery",
        slug: "jewellery",
        description: "Earrings, sets and statement pieces.",
        departmentId: fashion.id,
        parentId: accessories.id,
        featured: true,
        sortOrder: 1,
        active: true,
        seoTitle: "Jewellery | Denard",
        seoDescription: "Shop Denard jewellery — earrings and curated sets.",
      },
    });
  } else {
    await prisma.category.update({
      where: { id: jewellery.id },
      data: {
        active: true,
        featured: true,
        departmentId: fashion.id,
        parentId: accessories.id,
      },
    });
  }

  return { fashion, accessories, jewellery };
}

export function looksLikeJewellery(name: string) {
  return JEWELLERY_NAME.test(name);
}

/** Link product to jewellery (and accessories) if it looks like jewellery stock. */
export async function tagProductWithJewelleryCategories(productId: string) {
  const { accessories, jewellery } = await ensureJewelleryTaxonomy();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, categories: { select: { categoryId: true } } },
  });
  if (!product || !looksLikeJewellery(product.name)) return;

  const ids = new Set(product.categories.map((c) => c.categoryId));
  ids.add(jewellery.id);
  ids.add(accessories.id);

  await prisma.productCategory.createMany({
    data: [...ids].map((categoryId) => ({ productId, categoryId })),
    skipDuplicates: true,
  });
}

/** Backfill live catalogue: taxonomy + tags + isNew on recent publishes. */
export async function syncJewelleryCatalogueDisplay() {
  const { jewellery } = await ensureJewelleryTaxonomy();

  const published = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      isNew: true,
      publishedAt: true,
      categories: { select: { categoryId: true } },
    },
  });

  let tagged = 0;
  let markedNew = 0;
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  for (const product of published) {
    if (looksLikeJewellery(product.name)) {
      const ids = new Set(product.categories.map((c) => c.categoryId));
      if (!ids.has(jewellery.id)) {
        await prisma.productCategory.create({
          data: { productId: product.id, categoryId: jewellery.id },
        });
        tagged += 1;
      }
    }

    if (
      !product.isNew &&
      product.publishedAt &&
      product.publishedAt >= twoWeeksAgo
    ) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isNew: true },
      });
      markedNew += 1;
    }
  }

  return { tagged, markedNew, jewelleryId: jewellery.id };
}
