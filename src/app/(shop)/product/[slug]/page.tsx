import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, type Crumb } from "@/components/product/breadcrumbs";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { getProductBySlug } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { getWhatsAppPhone } from "@/lib/whatsapp-server";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription || undefined;
  return buildPageMetadata({
    title,
    description,
    path: `/product/${product.slug}`,
    image: product.images[0]?.url,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  await prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  const whatsappPhone = await getWhatsAppPhone();

  const related = product.relatedFrom.map((r) => ({
    id: r.toProduct.id,
    name: r.toProduct.name,
    slug: r.toProduct.slug,
    price: r.toProduct.price,
    compareAtPrice: r.toProduct.compareAtPrice,
    currency: r.toProduct.currency,
    images: r.toProduct.images,
    brand: r.toProduct.brand,
    variants: r.toProduct.variants,
  }));

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
  ];
  if (product.department) {
    crumbs.push({
      label: product.department.name,
      href: `/department/${product.department.slug}`,
    });
  }
  const primaryCat = product.categories[0]?.category;
  if (primaryCat) {
    crumbs.push({ label: primaryCat.name, href: `/category/${primaryCat.slug}` });
  }
  crumbs.push({ label: product.name });

  const imagesAbs = product.images.map((i) =>
    i.url.startsWith("http") ? i.url : absoluteUrl(i.url),
  );

  const reviewStats =
    product.reviews.length > 0
      ? {
          count: product.reviews.length,
          average:
            product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length,
        }
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    url: absoluteUrl(`/product/${product.slug}`),
    description: product.shortDescription || product.description || undefined,
    image: imagesAbs,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price,
      availability:
        product.availability === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: absoluteUrl(`/product/${product.slug}`),
      seller: { "@type": "Organization", name: "Denard" },
    },
    ...(reviewStats
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(reviewStats.average.toFixed(1)),
            reviewCount: reviewStats.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: product.reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.authorName },
            datePublished: r.createdAt.toISOString().slice(0, 10),
            reviewBody: r.body,
            name: r.title || undefined,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  };

  return (
    <div className="container-denard py-8 md:py-12 pb-28 sm:pb-12">
      <Breadcrumbs items={crumbs} className="mb-5" />

      <ProductDetailClient
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          currency: product.currency,
          shortDescription: product.shortDescription,
          description: product.description,
          careInstructions: product.careInstructions,
          sizeGuide: product.sizeGuide,
          availability: product.availability,
          isNew: product.isNew,
          isBestSeller: product.isBestSeller,
          isOnOffer: product.isOnOffer,
          isFeatured: product.isFeatured,
          brand: product.brand,
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            availability: v.availability,
            colour: v.colour,
            size: v.size,
          })),
        }}
        whatsappPhone={whatsappPhone}
      />

      <ProductReviews
        productId={product.id}
        average={reviewStats?.average ?? null}
        count={reviewStats?.count ?? 0}
        reviews={product.reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        }))}
      />

      {related.length > 0 ? (
        <section className="mt-14 md:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl md:text-3xl text-ink">You may also like</h2>
            <Link href="/shop" className="text-sm text-accent hover:underline">
              Shop all
            </Link>
          </div>
          <ProductGrid products={related} priorityCount={0} />
        </section>
      ) : null}

      <div className="mt-8">
        <RecentlyViewedRail excludeId={product.id} flush />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
