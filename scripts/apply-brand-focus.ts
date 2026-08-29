/**
 * One-off / ops: hide Home & Beauty from active nav and unpublish diluting demo SKUs.
 * Usage: npx tsx scripts/apply-brand-focus.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import {
  DILUTING_PRODUCT_SLUGS,
  HIDDEN_DEPARTMENT_SLUGS,
} from "../src/lib/brand-focus";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const depts = await prisma.department.updateMany({
    where: { slug: { in: [...HIDDEN_DEPARTMENT_SLUGS] } },
    data: { active: false },
  });
  console.log("Deactivated departments:", depts.count, [...HIDDEN_DEPARTMENT_SLUGS]);

  const products = await prisma.product.updateMany({
    where: { slug: { in: [...DILUTING_PRODUCT_SLUGS] } },
    data: { status: "DRAFT" },
  });
  console.log("Unpublished diluting products:", products.count, [...DILUTING_PRODUCT_SLUGS]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
