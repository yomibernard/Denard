/**
 * Fix broken R2 product image URLs missing the bucket path segment.
 * Run: npx tsx scripts/fix-r2-image-urls.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/db";
import { normalizePublicMediaUrl } from "@/lib/media-url";

async function main() {
  const images = await prisma.productImage.findMany({
    select: { id: true, url: true, product: { select: { name: true } } },
  });

  let updated = 0;
  let alreadyOk = 0;
  let skipped = 0;

  for (const img of images) {
    const next = normalizePublicMediaUrl(img.url);
    if (next === img.url) {
      if (img.url.includes(".r2.dev/")) alreadyOk += 1;
      else skipped += 1;
      continue;
    }

    // Verify the fixed URL exists before writing
    try {
      const res = await fetch(next, { method: "HEAD" });
      if (!res.ok) {
        console.log(`SKIP (HEAD ${res.status}) ${img.product.name}: ${next}`);
        continue;
      }
    } catch (e) {
      console.log(`SKIP (fetch fail) ${img.product.name}: ${e instanceof Error ? e.message : e}`);
      continue;
    }

    await prisma.productImage.update({
      where: { id: img.id },
      data: { url: next },
    });
    updated += 1;
    console.log(`FIXED ${img.product.name}`);
  }

  console.log(`\nUpdated=${updated} alreadyOk=${alreadyOk} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
