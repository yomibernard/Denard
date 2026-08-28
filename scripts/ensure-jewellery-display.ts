/**
 * Fix live catalogue display: create jewellery category and tag recent stock.
 * Run: npx tsx scripts/ensure-jewellery-display.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/db";
import { syncJewelleryCatalogueDisplay } from "@/lib/jewellery-taxonomy";
import { listProducts } from "@/lib/catalogue";

async function main() {
  const result = await syncJewelleryCatalogueDisplay();
  console.log("Taxonomy synced:", result);

  const jewellery = await listProducts({ categorySlug: "jewellery", pageSize: 5, sort: "newest" });
  console.log(`Jewellery category now has ${jewellery.total} products`);
  for (const p of jewellery.items) {
    console.log(`  - ${p.name}`);
  }

  const shop = await listProducts({ pageSize: 5, sort: "newest" });
  console.log("\nShop newest (first 5):");
  for (const p of shop.items) {
    console.log(`  - ${p.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
