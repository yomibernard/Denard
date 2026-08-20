/**
 * Import Denard jewelry stock from product photos into the catalogue.
 * Safe to re-run: upserts by SKU.
 */
import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = url.startsWith("file:")
  ? path.resolve(process.cwd(), url.replace(/^file:/, ""))
  : url;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: dbPath }),
});

type Item = {
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  images: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isOnOffer?: boolean;
};

const ITEMS: Item[] = [
  {
    name: "Silver Crystal Drop Earrings",
    slug: "silver-crystal-drop-earrings",
    sku: "DN-JWL-001",
    price: 48,
    compareAtPrice: 62,
    shortDescription: "Statement silver-tone drops with pavé crystal teardrops.",
    description:
      "Elegant silver-tone drop earrings featuring tiered crystal detailing and a luminous pavé teardrop finish. Designed for evenings, occasions and elevated everyday styling.",
    images: ["/images/products/silver-crystal-drop-earrings-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isBestSeller: true,
    isOnOffer: true,
  },
  {
    name: "Champagne Gold Tiered Drop Earrings",
    slug: "champagne-gold-tiered-drop-earrings",
    sku: "DN-JWL-002",
    price: 52,
    shortDescription: "Warm gold-tone tiered drops with crystal sparkle.",
    description:
      "Champagne gold drop earrings with graduated crystal tiers and a pavé teardrop pendant. A refined finishing piece for dinners, celebrations and formal wear.",
    images: ["/images/products/champagne-tiered-drop-earrings-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Mint Pavé Crescent Hoops",
    slug: "mint-pave-crescent-hoops",
    sku: "DN-JWL-003",
    price: 45,
    shortDescription: "Bold crescent hoops in deep mint crystal pavé.",
    description:
      "Wide crescent hoop earrings densely set with mint-toned crystals. A confident, contemporary silhouette that pairs beautifully with evening and day looks.",
    images: ["/images/products/mint-pave-crescent-hoops-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Gold Filigree Mint Teardrop Set",
    slug: "gold-filigree-mint-teardrop-set",
    sku: "DN-JWL-004",
    price: 78,
    compareAtPrice: 95,
    shortDescription: "Matching necklace and earrings with mint and ivory stones.",
    description:
      "A coordinated gold-tone filigree set with teardrop pendant and matching earrings. Soft mint, peach and ivory cabochons sit within intricate openwork metal for accessible elegance.",
    images: ["/images/products/gold-filigree-mint-set-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isOnOffer: true,
  },
  {
    name: "Gold Crystal Multi-Loop Earrings",
    slug: "gold-crystal-multi-loop-earrings",
    sku: "DN-JWL-005",
    price: 55,
    shortDescription: "Layered gold loops with baguette and round crystals.",
    description:
      "Statement multi-loop earrings in polished gold tone, pavé-set with round crystals and baguette accents. Unique beauty for occasions that call for presence.",
    images: ["/images/products/gold-crystal-loop-earrings-1.jpeg"],
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
  },
  {
    name: "Crystal Teddy Pendant Set",
    slug: "crystal-teddy-pendant-set",
    sku: "DN-JWL-006",
    price: 42,
    shortDescription: "Playful silver-tone teddy pendant with matching studs.",
    description:
      "A charming jewellery set with crystal teddy pendant and matching stud earrings. Silver-tone finish with brilliant centre stones — a gift-ready Denard favourite.",
    images: ["/images/products/crystal-teddy-pendant-set-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Gold Beaded Collar Set",
    slug: "gold-beaded-collar-set",
    sku: "DN-JWL-007",
    price: 98,
    compareAtPrice: 120,
    shortDescription: "Mesh gold collar with matching earrings, bracelet and ring.",
    description:
      "A full gold-tone beaded jewellery set: collar necklace, drop earrings, bracelet and ring. Textured beadwork creates a rich, luminous finish for formal evenings.",
    images: ["/images/products/gold-beaded-collar-set-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isBestSeller: true,
    isOnOffer: true,
  },
  {
    name: "Gold Multi-Strand Beaded Set",
    slug: "gold-multi-strand-beaded-set",
    sku: "DN-JWL-008",
    price: 110,
    shortDescription: "Five-strand gold bead necklace with cuff, ring and earrings.",
    description:
      "An elevated multi-strand gold beaded set with lantern earrings, open cuff and statement ring. Designed as a complete occasion edit.",
    images: [
      "/images/products/gold-multistrand-beaded-set-1.jpeg",
      "/images/products/gold-beaded-collar-set-1.jpeg",
    ],
    isNew: true,
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: "Gold Stardust Sphere Set",
    slug: "gold-stardust-sphere-set",
    sku: "DN-JWL-009",
    price: 85,
    shortDescription: "Frosted gold sphere necklace, earrings and cuff.",
    description:
      "A minimalist gold-tone set featuring textured stardust spheres on a fine mesh necklace, drop earrings and open cuff. Calm, modern and quietly luxurious.",
    images: ["/images/products/gold-stardust-sphere-set-1.jpeg"],
    isNew: true,
    isFeatured: true,
    isBestSeller: false,
  },
];

async function main() {
  console.log("Importing jewelry stock…");

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
      },
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
      },
    });
  }

  let brand = await prisma.brand.findUnique({ where: { slug: "denard-essentials" } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: { name: "Denard Essentials", slug: "denard-essentials", active: true },
    });
  }

  let collection = await prisma.collection.findUnique({ where: { slug: "jewellery-edit" } });
  if (!collection) {
    collection = await prisma.collection.create({
      data: {
        name: "Jewellery Edit",
        slug: "jewellery-edit",
        description: "New jewellery stock — earrings and curated sets.",
        featured: true,
        active: true,
        sortOrder: 0,
        imageUrl: "/images/products/champagne-tiered-drop-earrings-1.jpeg",
      },
    });
  } else {
    await prisma.collection.update({
      where: { id: collection.id },
      data: {
        featured: true,
        active: true,
        imageUrl: "/images/products/champagne-tiered-drop-earrings-1.jpeg",
      },
    });
  }

  const oneSize = await prisma.size.upsert({
    where: { slug: "one-size" },
    update: {},
    create: { name: "One Size", slug: "one-size", sortOrder: 99, active: true },
  });

  let sort = 0;
  for (const item of ITEMS) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        currency: "GBP",
        shortDescription: item.shortDescription,
        description: item.description,
        status: "PUBLISHED",
        availability: "IN_STOCK",
        stockQty: 20,
        isNew: item.isNew ?? true,
        isFeatured: item.isFeatured ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isOnOffer: item.isOnOffer ?? false,
        publishedAt: new Date(),
        departmentId: fashion.id,
        brandId: brand.id,
        sortOrder: sort,
        seoTitle: `${item.name} | Denard`,
        seoDescription: item.shortDescription,
        images: {
          create: item.images.map((url, i) => ({
            url,
            alt: item.name,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        },
        categories: {
          create: [{ categoryId: accessories.id }, { categoryId: jewellery.id }],
        },
        collections: {
          create: [{ collectionId: collection.id }],
        },
        variants: {
          create: {
            sku: `${item.sku}-OS`,
            sizeId: oneSize.id,
            price: item.price,
            compareAtPrice: item.compareAtPrice,
            stockQty: 20,
            availability: "IN_STOCK",
          },
        },
      },
      update: {
        name: item.name,
        slug: item.slug,
        price: item.price,
        compareAtPrice: item.compareAtPrice ?? null,
        currency: "GBP",
        shortDescription: item.shortDescription,
        description: item.description,
        status: "PUBLISHED",
        availability: "IN_STOCK",
        stockQty: 20,
        isNew: item.isNew ?? true,
        isFeatured: item.isFeatured ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isOnOffer: item.isOnOffer ?? false,
        publishedAt: new Date(),
        departmentId: fashion.id,
        brandId: brand.id,
        sortOrder: sort,
      },
    });

    // Refresh images on re-run
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: item.images.map((url, i) => ({
        productId: product.id,
        url,
        alt: item.name,
        isPrimary: i === 0,
        sortOrder: i,
      })),
    });

    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: product.id, categoryId: accessories.id } },
      create: { productId: product.id, categoryId: accessories.id },
      update: {},
    });
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: product.id, categoryId: jewellery.id } },
      create: { productId: product.id, categoryId: jewellery.id },
      update: {},
    });
    await prisma.productCollection.upsert({
      where: {
        productId_collectionId: { productId: product.id, collectionId: collection.id },
      },
      create: { productId: product.id, collectionId: collection.id },
      update: {},
    });

    console.log(`✓ ${item.sku} ${item.name}`);
    sort += 1;
  }

  console.log(`\nImported ${ITEMS.length} jewellery products.`);
  console.log("Homepage: New Arrivals / Best Sellers / Featured will include this stock.");
  console.log("Shop: /category/jewellery  ·  Collection: /collection/jewellery-edit");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
