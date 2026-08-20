import "dotenv/config";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = url.startsWith("file:")
  ? path.resolve(process.cwd(), url.replace(/^file:/, ""))
  : url;
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Denard catalogue...");
  console.log("DB:", dbPath);

  await prisma.analyticsEvent.deleteMany();
  await prisma.enquiryItem.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.productRelation.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productMaterial.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.material.deleteMany();
  await prisma.size.deleteMany();
  await prisma.colour.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.pageContent.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD ?? "DenardAdmin2026!", 12);

  await prisma.user.createMany({
    data: [
      {
        email: process.env.ADMIN_DEFAULT_EMAIL ?? "admin@denard.com",
        passwordHash,
        name: "Denard Admin",
        role: "SUPER_ADMIN",
      },
      {
        email: "sales@denard.com",
        passwordHash,
        name: "Sales Representative",
        role: "SALES_REP",
      },
      {
        email: "catalogue@denard.com",
        passwordHash,
        name: "Catalogue Manager",
        role: "CATALOGUE_ADMIN",
      },
    ],
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "whatsapp_phone", value: process.env.WHATSAPP_PHONE ?? "447887539426" },
      { key: "business_name", value: "Denard" },
      { key: "business_email", value: "hello@denard.co.uk" },
      { key: "business_phone", value: "+44 7887 539426" },
      { key: "business_address", value: "England, United Kingdom" },
      { key: "service_hours", value: "Mon–Sat, 9:00–18:00 GMT" },
      { key: "response_time", value: "Typically within 30 minutes during service hours" },
      { key: "currency", value: "GBP" },
      { key: "default_delivery_cities", value: "London,Manchester,Birmingham,Leeds,Sheffield,Edinburgh,Cardiff" },
      { key: "brand_tagline", value: "Timeless style, curated for life." },
    ],
  });

  await prisma.homepageSection.createMany({
    data: [
      { key: "hero", title: "Hero", sortOrder: 1 },
      { key: "shop_by_department", title: "Shop by Department", sortOrder: 2 },
      { key: "new_arrivals", title: "New Arrivals", sortOrder: 3 },
      { key: "best_sellers", title: "Best Sellers", sortOrder: 4 },
      { key: "featured_collections", title: "Featured Collections", sortOrder: 5 },
      { key: "recommended", title: "Recommended for You", sortOrder: 6 },
      { key: "offers", title: "Products on Offer", sortOrder: 7 },
      { key: "shop_by_need", title: "Shop by Need", sortOrder: 8 },
      { key: "why_denard", title: "Why Shop with Denard", sortOrder: 9 },
      { key: "testimonials", title: "Customer Stories", sortOrder: 10 },
      { key: "delivery", title: "Delivery & Service", sortOrder: 11 },
      { key: "whatsapp", title: "WhatsApp Assistance", sortOrder: 12 },
      { key: "newsletter", title: "Product Updates", sortOrder: 13 },
    ],
  });

  await prisma.banner.create({
    data: {
      title: "Products you can trust. Service you can message.",
      subtitle:
        "Browse the Denard catalogue and enquire on WhatsApp — personal guidance, clear pricing, reliable fulfilment.",
      imageUrl: "/images/hero.svg",
      linkUrl: "/shop",
      ctaLabel: "Shop Products",
      placement: "home_hero",
      sortOrder: 1,
    },
  });

  const colours = await Promise.all(
    [
      ["Black", "black", "#111111"],
      ["White", "white", "#F5F5F5"],
      ["Navy", "navy", "#1B2A4A"],
      ["Olive", "olive", "#556B2F"],
      ["Sand", "sand", "#C2A878"],
      ["Burgundy", "burgundy", "#6B2D3C"],
    ].map(([name, slug, hex], i) =>
      prisma.colour.create({ data: { name, slug, hex, sortOrder: i } }),
    ),
  );

  const sizes = await Promise.all(
    ["XS", "S", "M", "L", "XL", "XXL", "One Size"].map((name, i) =>
      prisma.size.create({
        data: { name, slug: name.toLowerCase().replace(/\s+/g, "-"), sortOrder: i },
      }),
    ),
  );

  const materials = await Promise.all(
    [
      ["Cotton", "cotton"],
      ["Linen", "linen"],
      ["Leather", "leather"],
      ["Wool blend", "wool-blend"],
      ["Stainless steel", "stainless-steel"],
    ].map(([name, slug]) => prisma.material.create({ data: { name, slug } })),
  );

  const brands = await Promise.all(
    [
      ["Denard Essentials", "denard-essentials"],
      ["Atelier Denard", "atelier-denard"],
      ["Denard Home", "denard-home"],
    ].map(([name, slug]) => prisma.brand.create({ data: { name, slug } })),
  );

  const fashion = await prisma.department.create({
    data: {
      name: "Fashion",
      slug: "fashion",
      description: "Refined everyday wear and elevated essentials for men and women.",
      imageUrl: "/images/dept-fashion.svg",
      featured: true,
      sortOrder: 1,
      seoTitle: "Fashion | Denard",
      seoDescription: "Shop Denard fashion — shirts, dresses, outerwear and accessories.",
    },
  });

  const home = await prisma.department.create({
    data: {
      name: "Home & Living",
      slug: "home-living",
      description: "Thoughtful pieces for living spaces that feel calm and considered.",
      imageUrl: "/images/dept-home.svg",
      featured: true,
      sortOrder: 2,
    },
  });

  const beauty = await prisma.department.create({
    data: {
      name: "Beauty & Care",
      slug: "beauty-care",
      description: "Everyday care products selected for quality and clarity.",
      imageUrl: "/images/dept-beauty.svg",
      featured: true,
      sortOrder: 3,
    },
  });

  const men = await prisma.category.create({
    data: {
      name: "Men",
      slug: "men",
      departmentId: fashion.id,
      featured: true,
      sortOrder: 1,
      description: "Menswear built for clarity, comfort and lasting wear.",
    },
  });
  const women = await prisma.category.create({
    data: {
      name: "Women",
      slug: "women",
      departmentId: fashion.id,
      featured: true,
      sortOrder: 2,
    },
  });
  const shirts = await prisma.category.create({
    data: {
      name: "Shirts",
      slug: "shirts",
      departmentId: fashion.id,
      parentId: men.id,
      sortOrder: 1,
    },
  });
  const dresses = await prisma.category.create({
    data: {
      name: "Dresses",
      slug: "dresses",
      departmentId: fashion.id,
      parentId: women.id,
      sortOrder: 1,
    },
  });
  const living = await prisma.category.create({
    data: {
      name: "Living Room",
      slug: "living-room",
      departmentId: home.id,
      featured: true,
      sortOrder: 1,
    },
  });
  const skincare = await prisma.category.create({
    data: {
      name: "Skincare",
      slug: "skincare",
      departmentId: beauty.id,
      featured: true,
      sortOrder: 1,
    },
  });

  const formal = await prisma.collection.create({
    data: {
      name: "Formal Wear",
      slug: "formal-wear",
      description: "Polished pieces for work and occasions.",
      featured: true,
      imageUrl: "/images/collection-formal.svg",
      sortOrder: 1,
    },
  });
  const everyday = await prisma.collection.create({
    data: {
      name: "Everyday Essentials",
      slug: "everyday-essentials",
      description: "Reliable pieces you reach for daily.",
      featured: true,
      imageUrl: "/images/collection-everyday.svg",
      sortOrder: 2,
    },
  });
  const homeEdit = await prisma.collection.create({
    data: {
      name: "Calm Home Edit",
      slug: "calm-home-edit",
      featured: true,
      imageUrl: "/images/collection-home.svg",
      sortOrder: 3,
    },
  });

  const tagNew = await prisma.tag.create({ data: { name: "New", slug: "new" } });
  const tagGift = await prisma.tag.create({ data: { name: "Gift idea", slug: "gift-idea" } });
  const tagOffice = await prisma.tag.create({ data: { name: "Office ready", slug: "office-ready" } });

  type SeedProduct = {
    name: string;
    slug: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    shortDescription: string;
    description: string;
    departmentId: string;
    brandId: string;
    categoryIds: string[];
    collectionIds: string[];
    materialIds: string[];
    isNew?: boolean;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isOnOffer?: boolean;
    colours?: number[];
    sizeIndexes?: number[];
    hue: string;
  };

  const products: SeedProduct[] = [
    {
      name: "Classic Long-Sleeve Shirt",
      slug: "classic-long-sleeve-shirt",
      sku: "DN-FSH-001",
      price: 89,
      compareAtPrice: 110,
      shortDescription: "Clean lines, breathable cotton, office to evening.",
      description:
        "A refined long-sleeve shirt cut for ease of movement. Soft cotton with a structured collar and subtle drape — designed for everyday formality.",
      departmentId: fashion.id,
      brandId: brands[0].id,
      categoryIds: [men.id, shirts.id],
      collectionIds: [formal.id, everyday.id],
      materialIds: [materials[0].id],
      isNew: true,
      isFeatured: true,
      isBestSeller: true,
      isOnOffer: true,
      colours: [0, 1, 2],
      sizeIndexes: [1, 2, 3, 4],
      hue: "#1f4b3a",
    },
    {
      name: "Linen Resort Shirt",
      slug: "linen-resort-shirt",
      sku: "DN-FSH-002",
      price: 95,
      shortDescription: "Relaxed linen with a refined resort finish.",
      description: "Open weave linen shirt with a soft collar and easy fit. Ideal for warm days and travel.",
      departmentId: fashion.id,
      brandId: brands[1].id,
      categoryIds: [men.id, shirts.id],
      collectionIds: [everyday.id],
      materialIds: [materials[1].id],
      isNew: true,
      isFeatured: true,
      colours: [1, 4, 3],
      sizeIndexes: [1, 2, 3, 4],
      hue: "#c2a878",
    },
    {
      name: "Structured Midi Dress",
      slug: "structured-midi-dress",
      sku: "DN-FSH-003",
      price: 145,
      compareAtPrice: 175,
      shortDescription: "Tailored midi silhouette with soft structure.",
      description: "A versatile midi dress with clean seams and a flattering line. Wear to work or evening occasions.",
      departmentId: fashion.id,
      brandId: brands[1].id,
      categoryIds: [women.id, dresses.id],
      collectionIds: [formal.id],
      materialIds: [materials[0].id],
      isBestSeller: true,
      isOnOffer: true,
      isFeatured: true,
      colours: [0, 2, 5],
      sizeIndexes: [0, 1, 2, 3, 4],
      hue: "#6b2d3c",
    },
    {
      name: "Wool Blend Overcoat",
      slug: "wool-blend-overcoat",
      sku: "DN-FSH-004",
      price: 285,
      shortDescription: "Long overcoat with a quiet, architectural cut.",
      description: "A wool-blend overcoat with a clean lapel and lined interior. Built for cooler evenings and travel.",
      departmentId: fashion.id,
      brandId: brands[1].id,
      categoryIds: [men.id, women.id],
      collectionIds: [formal.id],
      materialIds: [materials[3].id],
      isFeatured: true,
      colours: [0, 2],
      sizeIndexes: [1, 2, 3, 4],
      hue: "#1b2a4a",
    },
    {
      name: "Ceramic Table Lamp",
      slug: "ceramic-table-lamp",
      sku: "DN-HOM-001",
      price: 120,
      shortDescription: "Warm light, sculptural ceramic base.",
      description: "A ceramic table lamp with a fabric shade. Soft ambient light for living rooms and bedside tables.",
      departmentId: home.id,
      brandId: brands[2].id,
      categoryIds: [living.id],
      collectionIds: [homeEdit.id],
      materialIds: [],
      isNew: true,
      isFeatured: true,
      colours: [1, 4],
      sizeIndexes: [6],
      hue: "#9a6b3f",
    },
    {
      name: "Linen Throw Blanket",
      slug: "linen-throw-blanket",
      sku: "DN-HOM-002",
      price: 75,
      compareAtPrice: 95,
      shortDescription: "Breathable linen throw for calm living spaces.",
      description: "A soft linen throw with fringed edges. Layer over sofas or beds for texture and warmth.",
      departmentId: home.id,
      brandId: brands[2].id,
      categoryIds: [living.id],
      collectionIds: [homeEdit.id, everyday.id],
      materialIds: [materials[1].id],
      isOnOffer: true,
      isBestSeller: true,
      colours: [1, 3, 4],
      sizeIndexes: [6],
      hue: "#556b2f",
    },
    {
      name: "Daily Balance Moisturiser",
      slug: "daily-balance-moisturiser",
      sku: "DN-BTY-001",
      price: 42,
      shortDescription: "Lightweight daily hydration for all skin types.",
      description: "A clear, fragrance-light moisturiser formulated for everyday use.",
      departmentId: beauty.id,
      brandId: brands[0].id,
      categoryIds: [skincare.id],
      collectionIds: [everyday.id],
      materialIds: [],
      isBestSeller: true,
      isNew: true,
      colours: [],
      sizeIndexes: [6],
      hue: "#5a7a6a",
    },
    {
      name: "Leather Crossbody Bag",
      slug: "leather-crossbody-bag",
      sku: "DN-FSH-005",
      price: 195,
      shortDescription: "Compact leather bag with adjustable strap.",
      description: "Full-grain leather crossbody with thoughtful pockets and a quiet silhouette.",
      departmentId: fashion.id,
      brandId: brands[1].id,
      categoryIds: [women.id],
      collectionIds: [everyday.id, formal.id],
      materialIds: [materials[2].id],
      isFeatured: true,
      isNew: true,
      colours: [0, 4, 5],
      sizeIndexes: [6],
      hue: "#4a3020",
    },
  ];

  const createdProducts = [];
  for (const [index, p] of products.entries()) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        currency: "GBP",
        shortDescription: p.shortDescription,
        description: p.description,
        specifications: JSON.stringify([
          { label: "Origin", value: "Selected global suppliers" },
          { label: "Care", value: "See product care notes" },
          { label: "Warranty", value: "As stated on fulfilment" },
        ]),
        careInstructions: "Follow the care label. Avoid harsh detergents. Store in a dry place.",
        sizeGuide: "Use the size chart on this page. When between sizes, enquire on WhatsApp for guidance.",
        status: "PUBLISHED",
        availability: "IN_STOCK",
        stockQty: 25,
        isNew: p.isNew ?? false,
        isFeatured: p.isFeatured ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isOnOffer: p.isOnOffer ?? false,
        publishedAt: new Date(),
        departmentId: p.departmentId,
        brandId: p.brandId,
        viewCount: 40 + index * 17,
        enquiryCount: 2 + index,
        sortOrder: index,
        seoTitle: `${p.name} | Denard`,
        seoDescription: p.shortDescription,
        images: {
          create: [
            {
              url: `/images/products/${p.slug}-1.svg`,
              alt: p.name,
              isPrimary: true,
              sortOrder: 0,
            },
            {
              url: `/images/products/${p.slug}-2.svg`,
              alt: `${p.name} alternate view`,
              sortOrder: 1,
            },
          ],
        },
        categories: { create: p.categoryIds.map((categoryId) => ({ categoryId })) },
        collections: { create: p.collectionIds.map((collectionId) => ({ collectionId })) },
        materials: { create: p.materialIds.map((materialId) => ({ materialId })) },
        tags: {
          create: [
            ...(p.isNew ? [{ tagId: tagNew.id }] : []),
            ...(p.categoryIds.includes(men.id) || p.categoryIds.includes(women.id)
              ? [{ tagId: tagOffice.id }]
              : []),
            ...(p.price < 100 ? [{ tagId: tagGift.id }] : []),
          ],
        },
      },
    });

    const colourIds = (p.colours ?? []).map((i) => colours[i]);
    const sizeIds = (p.sizeIndexes ?? [6]).map((i) => sizes[i]);
    let v = 1;
    for (const colour of colourIds.length ? colourIds : [null]) {
      for (const size of sizeIds) {
        await prisma.productVariant.create({
          data: {
            sku: `${p.sku}-${String(v).padStart(2, "0")}`,
            productId: product.id,
            colourId: colour?.id,
            sizeId: size.id,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            stockQty: 8,
            availability: "IN_STOCK",
          },
        });
        v += 1;
      }
    }
    createdProducts.push({ ...product, hue: p.hue });
  }

  await prisma.productRelation.createMany({
    data: [
      { fromProductId: createdProducts[0].id, toProductId: createdProducts[1].id, relationType: "related" },
      {
        fromProductId: createdProducts[0].id,
        toProductId: createdProducts[3].id,
        relationType: "bought_together",
      },
      { fromProductId: createdProducts[2].id, toProductId: createdProducts[8].id, relationType: "related" },
      {
        fromProductId: createdProducts[7].id,
        toProductId: createdProducts[9].id,
        relationType: "bought_together",
      },
    ],
  });

  const pages: Array<{ slug: string; title: string; body: string }> = [
    {
      slug: "about",
      title: "About Denard",
      body: "Denard is a premium contemporary fashion company based in England, United Kingdom. We help customers discover quality products online and complete their purchase with personal guidance on WhatsApp — honest information, careful fulfilment, and service that feels human. Timeless style, curated for life.",
    },
    {
      slug: "delivery",
      title: "Delivery Information",
      body: "Delivery options and timelines are confirmed with you on WhatsApp after your enquiry. We serve major cities and can arrange courier or pickup depending on your location. You will receive clear cost and timing before payment.",
    },
    {
      slug: "how-to-order",
      title: "How to Order",
      body: "1. Browse or search for products.\n2. Select options such as colour and size.\n3. Add items to your enquiry list.\n4. Send your enquiry on WhatsApp.\n5. A Denard representative confirms availability, total cost, payment and delivery.",
    },
    {
      slug: "faq",
      title: "Frequently Asked Questions",
      body: "Q: Do I pay on the website?\nA: Not in this phase. Payment details are shared securely through WhatsApp after availability is confirmed.\n\nQ: How fast will you respond?\nA: During service hours we typically respond within 30 minutes.\n\nQ: Can I order multiple products?\nA: Yes. Use the enquiry basket and send one combined request.",
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      body: "We collect only the information needed to process your enquiry — such as your name, phone number and delivery location. We do not request card details through the website. Contact us to update or remove your information.",
    },
    {
      slug: "terms",
      title: "Terms and Conditions",
      body: "Product availability and pricing displayed on the website are indicative and confirmed during the WhatsApp conversation. Denard reserves the right to correct errors and update catalogue information.",
    },
    {
      slug: "returns",
      title: "Returns and Exchange Policy",
      body: "Eligible returns and exchanges are arranged through WhatsApp with your enquiry reference. Items must be unused and in original condition unless otherwise agreed. Specific windows depend on product category.",
    },
    {
      slug: "contact",
      title: "Contact Us",
      body: "Message us on WhatsApp at +44 7887 539426, email hello@denard.co.uk, or visit us in England, United Kingdom during service hours. We are here to help with product questions, availability and fulfilment.",
    },
  ];

  for (const page of pages) {
    await prisma.pageContent.create({
      data: {
        ...page,
        seoTitle: `${page.title} | Denard`,
        seoDescription: page.body.slice(0, 155),
      },
    });
  }

  console.log(`Seeded ${createdProducts.length} products and admin users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
