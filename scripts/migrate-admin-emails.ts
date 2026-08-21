import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const pairs = [
    ["admin@denard.com", "admin@denard.co.uk"],
    ["sales@denard.com", "sales@denard.co.uk"],
    ["catalogue@denard.com", "catalogue@denard.co.uk"],
  ] as const;

  for (const [from, to] of pairs) {
    const old = await prisma.user.findUnique({ where: { email: from } });
    const neu = await prisma.user.findUnique({ where: { email: to } });
    if (old && !neu) {
      await prisma.user.update({ where: { id: old.id }, data: { email: to } });
      console.log(`Migrated ${from} -> ${to}`);
    } else if (neu) {
      console.log(`Already have ${to}`);
    } else {
      console.log(`No user ${from}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
