/**
 * Prefer real jewellery photography over SVG placeholder merch.
 * - Unfeature / archive products whose primary image is an .svg placeholder
 * - Feature published products that use jpeg/png/webp photography
 *
 * Run: npx tsx scripts/prefer-jewelry-merch.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const products = await prisma.product.findMany({
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
  });

  let featuredPhoto = 0;
  let demotedSvg = 0;

  for (const p of products) {
    const url = p.images[0]?.url?.toLowerCase() ?? "";
    const isPhoto = /\.(jpe?g|png|webp)(\?|$)/i.test(url) || url.includes("whatsapp image");
    const isSvg = url.endsWith(".svg");

    if (isPhoto && p.status === "PUBLISHED") {
      await prisma.product.update({
        where: { id: p.id },
        data: { isFeatured: true },
      });
      featuredPhoto += 1;
    } else if (isSvg || !url) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          isFeatured: false,
          isBestSeller: false,
          // Keep in catalogue as draft-quality placeholders unless already archived
          status: p.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT",
        },
      });
      demotedSvg += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        total: products.length,
        featuredPhoto,
        demotedSvgPlaceholders: demotedSvg,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
