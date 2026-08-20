/**
 * Set business address to England, United Kingdom.
 * Run: npx tsx scripts/update-address.ts
 */
import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const ADDRESS = "England, United Kingdom";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = url.startsWith("file:")
  ? path.resolve(process.cwd(), url.replace(/^file:/, ""))
  : url;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: dbPath }),
});

async function main() {
  await prisma.siteSetting.upsert({
    where: { key: "business_address" },
    create: { key: "business_address", value: ADDRESS },
    update: { value: ADDRESS },
  });
  console.log(`business_address → ${ADDRESS}`);

  const pages = await prisma.pageContent.findMany();
  for (const page of pages) {
    if (!page.body.includes("Doncaster")) continue;
    await prisma.pageContent.update({
      where: { id: page.id },
      data: {
        body: page.body
          .replaceAll("Doncaster, United Kingdom", ADDRESS)
          .replaceAll("Doncaster, UK", "England, UK")
          .replaceAll("in Doncaster", "in England")
          .replaceAll("from Doncaster", "from England")
          .replaceAll("Doncaster", "England"),
        seoTitle: page.seoTitle
          ?.replaceAll("Doncaster", "England")
          .replaceAll("England, UK", "England, UK"),
        seoDescription: page.seoDescription
          ?.replaceAll("Doncaster, United Kingdom", ADDRESS)
          .replaceAll("Doncaster, UK", "England, UK")
          .replaceAll("Doncaster", "England"),
      },
    });
    console.log(`Updated page ${page.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
