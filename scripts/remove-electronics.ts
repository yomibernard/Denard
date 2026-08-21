/**
 * Remove Electronics department, its categories, and all electronics products.
 * Run: npx tsx scripts/remove-electronics.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

async function deleteProducts(productIds: string[]) {
  if (!productIds.length) return;
  await prisma.enquiryItem.deleteMany({ where: { productId: { in: productIds } } });
  await prisma.analyticsEvent.deleteMany({ where: { productId: { in: productIds } } }).catch(() => undefined);
  await prisma.productRelation.deleteMany({
    where: {
      OR: [{ fromProductId: { in: productIds } }, { toProductId: { in: productIds } }],
    },
  });
  // Cascades handle images/variants/categories/collections/materials/tags
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
}

async function main() {
  const electronics = await prisma.department.findUnique({
    where: { slug: "electronics" },
    include: {
      categories: true,
      products: { select: { id: true, name: true, sku: true } },
    },
  });

  const techBrand = await prisma.brand.findUnique({ where: { slug: "denard-tech" } });

  if (!electronics) {
    console.log("No Electronics department found.");
  } else {
    console.log(
      `Electronics: ${electronics.products.length} products, ${electronics.categories.length} categories`,
    );
    for (const p of electronics.products) {
      console.log(`  - ${p.sku} ${p.name}`);
    }

    await deleteProducts(electronics.products.map((p) => p.id));
    console.log(`Deleted ${electronics.products.length} products`);

    await prisma.category.deleteMany({ where: { departmentId: electronics.id } });
    await prisma.department.delete({ where: { id: electronics.id } });
    console.log("Deleted Electronics department and categories");
  }

  const leftovers = await prisma.product.findMany({
    where: {
      OR: [{ sku: { startsWith: "DN-ELC" } }, { sku: { startsWith: "DN-EL" } }],
    },
    select: { id: true, name: true, sku: true },
  });

  if (leftovers.length) {
    console.log(
      "Removing leftover electronics SKUs:",
      leftovers.map((p) => p.name).join(", "),
    );
    await deleteProducts(leftovers.map((p) => p.id));
  }

  if (techBrand) {
    const stillUsing = await prisma.product.count({ where: { brandId: techBrand.id } });
    if (!stillUsing) {
      await prisma.brand.delete({ where: { id: techBrand.id } });
      console.log("Deleted Denard Tech brand");
    }
  }

  const remaining = await prisma.product.findMany({
    select: { name: true, sku: true, department: { select: { slug: true } } },
    orderBy: { sku: "asc" },
  });
  console.log(`\nRemaining products (${remaining.length}):`);
  for (const p of remaining) {
    console.log(`  [${p.department?.slug ?? "?"}] ${p.sku} — ${p.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
