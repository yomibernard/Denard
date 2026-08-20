import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, type Crumb } from "@/components/product/breadcrumbs";
import { ProductDetailClient } from "@/components/product/product-detail-client";
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
