import { prisma } from "@/lib/db";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";

export async function getActiveDepartments() {
  return prisma.department.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      categories: {
        where: { active: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        include: {
          children: {
            where: { active: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function getNavigationTree() {
  return getActiveDepartments();
}

export type ProductListParams = {
  departmentSlug?: string;
  categorySlug?: string;
  collectionSlug?: string;
  brandSlug?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  colour?: string;
  size?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isOnOffer?: boolean;
  isFeatured?: boolean;
};

const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 2 },
  brand: true,
  variants: {
    where: { active: true },
    include: { colour: true, size: true },
  },
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

export async function listProducts(params: ProductListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(48, params.pageSize ?? 24);
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED" as ProductStatus,
  };

  if (params.departmentSlug) {
    where.department = { slug: params.departmentSlug, active: true };
  }
  if (params.categorySlug) {
    where.categories = { some: { category: { slug: params.categorySlug, active: true } } };
  }
  if (params.collectionSlug) {
    where.collections = { some: { collection: { slug: params.collectionSlug, active: true } } };
  }
  if (params.brandSlug) {
    where.brand = { slug: params.brandSlug, active: true };
  }
  if (params.q) {
    const q = params.q.trim();
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { shortDescription: { contains: q } },
      { brand: { name: { contains: q } } },
    ];
  }
  if (params.colour) {
    where.variants = { some: { active: true, colour: { slug: params.colour } } };
  }
  if (params.size) {
    where.variants = {
      some: {
        active: true,
        size: { slug: params.size },
        ...(params.colour ? { colour: { slug: params.colour } } : {}),
      },
    };
  }
  if (params.material) {
    where.materials = { some: { material: { slug: params.material } } };
  }
  if (params.minPrice != null || params.maxPrice != null) {
    where.price = {};
    if (params.minPrice != null) where.price.gte = params.minPrice;
    if (params.maxPrice != null) where.price.lte = params.maxPrice;
  }
  if (params.availability) {
    where.availability = params.availability as Prisma.EnumAvailabilityStatusFilter["equals"];
  }
  if (params.isNew) where.isNew = true;
  if (params.isBestSeller) where.isBestSeller = true;
  if (params.isOnOffer) where.isOnOffer = true;
  if (params.isFeatured) where.isFeatured = true;

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
    { sortOrder: "asc" };
  switch (params.sort) {
    case "newest":
      orderBy = { publishedAt: "desc" };
      break;
    case "popular":
      orderBy = { enquiryCount: "desc" };
      break;
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    case "discount":
      orderBy = { compareAtPrice: "desc" };
      break;
    default:
      // recommended
      orderBy = [{ isFeatured: "desc" }, { sortOrder: "asc" }];
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      brand: true,
      department: true,
      variants: {
        where: { active: true },
        include: { colour: true, size: true },
        orderBy: { sku: "asc" },
      },
      categories: { include: { category: true } },
      collections: { include: { collection: true } },
      materials: { include: { material: true } },
      tags: { include: { tag: true } },
      relatedFrom: {
        include: {
          toProduct: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              brand: true,
              variants: { where: { active: true }, include: { colour: true } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function searchSuggestions(q: string) {
  const term = q.trim();
  if (!term) return { products: [], categories: [] };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { name: { contains: term } },
          { sku: { contains: term } },
          { brand: { name: { contains: term } } },
        ],
      },
      take: 6,
      include: { images: { where: { isPrimary: true }, take: 1 }, brand: true },
    }),
    prisma.category.findMany({
      where: { active: true, name: { contains: term } },
      take: 4,
    }),
  ]);

  return { products, categories };
}

export async function getSiteSetting(key: string, fallback = "") {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function getHomepageSections() {
  return prisma.homepageSection.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getActiveBanners(placement = "home_hero") {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      active: true,
      placement,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
}

export type PlpFacets = {
  colours: Array<{ slug: string; name: string }>;
  sizes: Array<{ slug: string; name: string }>;
  brands: Array<{ slug: string; name: string }>;
};

export async function getPlpFacets(): Promise<PlpFacets> {
  const [colours, sizes, brands] = await Promise.all([
    prisma.colour.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.size.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  return { colours, sizes, brands };
}
