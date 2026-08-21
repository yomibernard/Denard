import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export type VariantLineInput = {
  sku: string;
  name?: string | null;
  colourName?: string | null;
  sizeName?: string | null;
  price?: number | null;
};

/** Parse admin textarea lines: SKU | Style | Colour | Size | Price */
export function parseVariantsText(text: string): VariantLineInput[] {
  const lines: VariantLineInput[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split("|").map((p) => p.trim());
    const [sku, name, colourName, sizeName, priceRaw] = parts;
    if (!sku) continue;
    const price =
      priceRaw != null && priceRaw !== "" && !Number.isNaN(Number(priceRaw))
        ? Number(priceRaw)
        : null;
    lines.push({
      sku,
      name: name || null,
      colourName: colourName || null,
      sizeName: sizeName || null,
      price,
    });
  }
  return lines;
}

export function formatVariantsText(
  variants: Array<{
    sku: string;
    name: string | null;
    price: number | null;
    colour: { name: string } | null;
    size: { name: string } | null;
  }>,
) {
  return variants
    .map((v) =>
      [v.sku, v.name ?? "", v.colour?.name ?? "", v.size?.name ?? "", v.price ?? ""]
        .join(" | ")
        .replace(/\s+\|\s+$/, ""),
    )
    .join("\n");
}

async function ensureColour(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  return prisma.colour.upsert({
    where: { slug },
    create: { name: trimmed, slug, hex: "#C5A46D" },
    update: { name: trimmed },
  });
}

async function ensureSize(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  return prisma.size.upsert({
    where: { slug },
    create: { name: trimmed, slug },
    update: { name: trimmed },
  });
}

export async function syncProductCategories(productId: string, categoryIds: string[]) {
  const ids = [...new Set(categoryIds.filter(Boolean))];
  await prisma.productCategory.deleteMany({ where: { productId } });
  if (!ids.length) return;
  await prisma.productCategory.createMany({
    data: ids.map((categoryId) => ({ productId, categoryId })),
    skipDuplicates: true,
  });
}

export async function syncProductCollections(productId: string, collectionIds: string[]) {
  const ids = [...new Set(collectionIds.filter(Boolean))];
  await prisma.productCollection.deleteMany({ where: { productId } });
  if (!ids.length) return;
  await prisma.productCollection.createMany({
    data: ids.map((collectionId) => ({ productId, collectionId })),
    skipDuplicates: true,
  });
}

export async function syncProductVariants(
  productId: string,
  lines: VariantLineInput[],
  fallbackPrice: number,
) {
  // Replace simple variant set from admin text editor
  await prisma.productVariant.deleteMany({ where: { productId } });
  for (const line of lines) {
    const colour = line.colourName ? await ensureColour(line.colourName) : null;
    const size = line.sizeName ? await ensureSize(line.sizeName) : null;
    await prisma.productVariant.create({
      data: {
        productId,
        sku: line.sku,
        name: line.name,
        price: line.price ?? fallbackPrice,
        colourId: colour?.id,
        sizeId: size?.id,
        availability: "IN_STOCK",
        active: true,
      },
    });
  }
}
