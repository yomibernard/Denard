import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { InstagramStrip } from "@/components/home/instagram-strip";
import { MediaVideo } from "@/components/home/media-video";
import { SectionHeader } from "@/components/home/section-header";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { buttonClassName } from "@/components/ui/button";
import {
  getActiveBanners,
  getActiveDepartments,
  getHomepageSections,
  listProducts,
} from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { buildPageMetadata } from "@/lib/seo";
import { buildWhatsAppUrl, generalAssistanceMessage } from "@/lib/whatsapp";
import { getWhatsAppPhone } from "@/lib/whatsapp-server";
import { shopImageProps } from "@/lib/shop-image";
import { MessageCircle, ShieldCheck, Truck, Sparkles } from "lucide-react";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Timeless style, curated for life.",
  description:
    "Denard jewellery and fashion from England, UK. Browse curated pieces and enquire on WhatsApp for personal guidance.",
  path: "/",
  image: "/images/products/champagne-tiered-drop-earrings-1.jpeg",
});

const FASHION_CATEGORIES = [
  {
    label: "Women",
    href: "/category/women",
    image: "/images/brand/category-women.svg",
  },
  {
    label: "Men",
    href: "/category/men",
    image: "/images/brand/category-men.svg",
  },
  {
    label: "Jewellery",
    href: "/category/jewellery",
    image: "/images/products/champagne-tiered-drop-earrings-1.jpeg",
  },
  {
    label: "New arrivals",
    href: "/new-arrivals",
    image: "/images/products/mint-pave-crescent-hoops-1.jpeg",
  },
];

export default async function HomePage() {
  const [banners, departments, sections, whatsappPhone, collections] = await Promise.all([
    getActiveBanners("home_hero"),
    getActiveDepartments(),
    getHomepageSections(),
    getWhatsAppPhone(),
    prisma.collection.findMany({
      where: { active: true, featured: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
  ]);

  const sectionOn = (key: string) => sections.find((s) => s.key === key)?.active !== false;

  const [newArrivals, bestSellers, offers, recommended] = await Promise.all([
    listProducts({ isNew: true, pageSize: 8, sort: "newest" }),
    listProducts({ isBestSeller: true, pageSize: 8, sort: "popular" }),
    listProducts({ isOnOffer: true, pageSize: 8, sort: "discount" }),
    listProducts({ isFeatured: true, pageSize: 8 }),
  ]);

  const hero = banners[0];
  const waHref = buildWhatsAppUrl(whatsappPhone, generalAssistanceMessage());

  return (
    <div>
      {sectionOn("hero") ? (
        <Hero
          title={hero?.title ?? "Timeless style. Accessible elegance."}
          subtitle={
            hero?.subtitle ??
            "Browse curated jewellery and fashion — enquire on WhatsApp for personal guidance, clear pricing and reliable fulfilment."
          }
          imageSrc="/images/products/champagne-tiered-drop-earrings-1.jpeg"
          imageSrcMobile="/images/products/mint-pave-crescent-hoops-1.jpeg"
          imageAlt="Denard jewellery new arrivals"
          videoSrc="/videos/necklace.mp4"
          shopHref={hero?.linkUrl ?? "/shop"}
          whatsappPhone={whatsappPhone}
          promo="Shop the edit. Confirm availability, payment and delivery with Denard on WhatsApp."
        />
      ) : null}

      {/* Fashion category strip — full-bleed, aligned tiles */}
      <section className="border-b border-line bg-line">
        <div className="grid grid-cols-2 gap-px md:grid-cols-4">
          {FASHION_CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group relative aspect-[4/5] overflow-hidden bg-ivory sm:aspect-square md:aspect-[4/5]"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width:768px) 50vw, 25vw"
                {...shopImageProps(cat.image)}
              />
              <div className="absolute inset-0 bg-ink/30 transition group-hover:bg-ink/40" />
              <span className="absolute inset-x-0 bottom-0 p-3 font-display text-xl text-white sm:p-4 sm:text-2xl md:text-3xl">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {sectionOn("shop_by_department") ? (
        <section className="container-denard py-16 md:py-24">
          <SectionHeader
            title="Shop by department"
            subtitle="Explore the Denard catalogue — refined pieces across fashion and lifestyle."
            href="/shop"
          />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {departments.map((d) => (
              <Link
                key={d.id}
                href={`/department/${d.slug}`}
                className="group relative aspect-[3/4] overflow-hidden bg-sand animate-fade-up"
              >
                <Image
                  src={d.imageUrl ?? "/images/brand/category-new.svg"}
                  alt={d.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:768px) 50vw, 25vw"
                  {...shopImageProps(d.imageUrl ?? "/images/brand/category-new.svg")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-xl text-white md:text-2xl">{d.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Campaign banners */}
      <section className="container-denard grid gap-4 py-12 md:grid-cols-2 md:gap-5 md:py-16">
        <Link href="/new-arrivals" className="group relative aspect-[16/10] overflow-hidden bg-ink">
          <Image
            src="/images/brand/campaign-new-arrivals.svg"
            alt="New arrivals"
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-ink/30" />
          <div className="absolute bottom-0 p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Campaign</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">New arrivals</h2>
            <span className="mt-4 inline-block text-sm text-white/90 underline decoration-gold underline-offset-4">
              Explore the edit
            </span>
          </div>
        </Link>
        <Link href="/best-sellers" className="group relative aspect-[16/10] overflow-hidden bg-ink">
          <Image
            src="/images/brand/campaign-best-sellers.svg"
            alt="Best sellers"
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-ink/30" />
          <div className="absolute bottom-0 p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Most requested</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">Best sellers</h2>
            <span className="mt-4 inline-block text-sm text-white/90 underline decoration-gold underline-offset-4">
              Shop favourites
            </span>
          </div>
        </Link>
      </section>

      {sectionOn("new_arrivals") ? (
        <section className="bg-surface py-16 md:py-24">
          <div className="container-denard">
            <SectionHeader
              title="New arrivals"
              subtitle="Fresh pieces for the season — timeless cuts, considered fabrics."
              href="/new-arrivals"
            />
            <div className="mt-8 relative aspect-[16/9] overflow-hidden bg-sand md:aspect-[21/9]">
              <MediaVideo src="/videos/new-arrival-beads.mp4" label="New arrival beads" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold">Just in</p>
                <h3 className="mt-1 font-display text-2xl text-white md:text-3xl">Beaded new arrivals</h3>
                <Link
                  href="/new-arrivals"
                  className="mt-3 inline-block text-sm text-white underline decoration-gold underline-offset-4"
                >
                  Shop new arrivals
                </Link>
              </div>
            </div>
            <div className="mt-8">
              <ProductGrid products={newArrivals.items} />
            </div>
          </div>
        </section>
      ) : null}

      {sectionOn("best_sellers") ? (
        <section className="container-denard py-16 md:py-24">
          <SectionHeader
            title="Best sellers"
            subtitle="Pieces customers return to — and enquire about most."
            href="/best-sellers"
          />
          <div className="mt-8">
            <ProductGrid products={bestSellers.items} />
          </div>
        </section>
      ) : null}

      {/* Collection banners: Women / Men / Accessories */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="container-denard">
          <SectionHeader
            title="Collections"
            subtitle="Editorial edits for how you dress and live."
            href="/collections"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Women",
                href: "/category/women",
                image: "/images/brand/banner-women.svg",
              },
              {
                title: "Jewellery",
                href: "/category/jewellery",
                image: "/images/products/gold-beaded-collar-set-1.jpeg",
              },
              {
                title: "Accessories",
                href: "/category/accessories",
                image: "/images/products/gold-stardust-sphere-set-1.jpeg",
              },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group relative aspect-[4/5] overflow-hidden bg-ink md:aspect-[3/4]"
              >
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <h3 className="font-display text-3xl text-white">{c.title}</h3>
                  <span className="mt-2 inline-block text-xs uppercase tracking-[0.14em] text-gold">
                    View collection
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {sectionOn("featured_collections") && collections.length > 0 ? (
        <section className="container-denard py-16 md:py-20">
          <SectionHeader
            title="Featured edits"
            subtitle="Curated looks for work, evenings and everyday ease."
            href="/collections"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collection/${c.slug}`}
                className="group relative aspect-[16/10] overflow-hidden bg-ink"
              >
                <Image
                  src={c.imageUrl ?? "/images/brand/campaign-new-arrivals.svg"}
                  alt={c.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-2xl text-white">{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sectionOn("recommended") ? (
        <section className="bg-surface py-16 md:py-24">
          <div className="container-denard">
            <SectionHeader title="Recommended" subtitle="Selected for balance, quality and wearability." />
            <div className="mt-8">
              <ProductGrid products={recommended.items} />
            </div>
          </div>
        </section>
      ) : null}

      {sectionOn("offers") ? (
        <section className="container-denard py-16 md:py-24">
          <SectionHeader
            title="On offer"
            subtitle="Seasonal prices — confirmed with you on WhatsApp."
            href="/offers"
          />
          <div className="mt-6 mb-8 border border-amber/40 bg-sand/60 px-4 py-3 text-sm text-ink-soft">
            <span className="mr-2 inline-block bg-amber px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
              Offer
            </span>
            Selected pieces with promotional pricing this season.
          </div>
          <ProductGrid products={offers.items} />
        </section>
      ) : null}

      {sectionOn("shop_by_need") ? (
        <section className="border-y border-line bg-ivory py-16 md:py-20">
          <div className="container-denard">
            <SectionHeader title="Shop by occasion" subtitle="Clear paths when you know how you’ll wear it." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Office ready", href: "/shop?q=office" },
                { label: "Evening polish", href: "/collection/formal-wear" },
                { label: "Everyday ease", href: "/collection/everyday-essentials" },
                { label: "Gift edit", href: "/shop?q=gift" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-line bg-surface px-5 py-7 transition hover:border-gold"
                >
                  <span className="font-display text-2xl text-ink">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {sectionOn("why_denard") ? (
        <section className="border-y border-line bg-mint-soft py-16 md:py-24">
          <div className="container-denard">
            <SectionHeader
              title="Why Denard"
              subtitle="Premium contemporary fashion with human WhatsApp service."
            />
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "Curated for confidence",
                  body: "Timeless silhouettes and considered details — not noise, not trends for their own sake.",
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp-assisted shopping",
                  body: "Ask about fit, fabric and fulfilment. A Denard representative guides your order.",
                },
                {
                  icon: Truck,
                  title: "Clear fulfilment",
                  body: "Availability, total cost and delivery are confirmed with you before payment.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <item.icon className="h-6 w-6 text-mint-deep" strokeWidth={1.4} />
                  <h3 className="mt-5 font-display text-2xl text-ink">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* About craftsmanship teaser */}
      <section className="container-denard py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
            <Image
              src="/images/brand/about-craftsmanship.svg"
              alt="Denard craftsmanship"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">About Denard</p>
            <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">
              Crafted for lasting wear
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base">
              Denard is a premium contemporary fashion company based in England, United Kingdom.
              We focus on timeless style, curated products and accessible elegance — helping you
              discover pieces online and complete your purchase with personal guidance on WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className={buttonClassName({ variant: "primary" })}>
                Our story
              </Link>
              <Link href="/how-to-order" className={buttonClassName({ variant: "outline" })}>
                How to order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {sectionOn("testimonials") ? (
        <section className="border-t border-line bg-surface py-16 md:py-24">
          <div className="container-denard">
            <SectionHeader
              title="How customers describe shopping with us"
              subtitle="Illustrative service stories — not verified product reviews. Real product ratings appear on product pages when moderated."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  quote:
                    "The edit felt considered. I messaged on WhatsApp and had clear delivery options the same day.",
                  name: "Amaka O.",
                  place: "London",
                },
                {
                  quote:
                    "Sizing guidance before I ordered made the difference. Simple, premium, no pressure.",
                  name: "Daniel K.",
                  place: "England",
                },
                {
                  quote:
                    "I sent a multi-item enquiry and tracked it with my reference. Felt like a real boutique.",
                  name: "Fatima S.",
                  place: "Manchester",
                },
              ].map((t) => (
                <blockquote key={t.name} className="border border-line border-l-gold bg-ivory p-6 border-l-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Illustrative
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">“{t.quote}”</p>
                  <footer className="mt-5 text-xs font-medium uppercase tracking-[0.08em] text-ink">
                    {t.name} · {t.place}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {sectionOn("delivery") ? (
        <section className="bg-mint-soft py-12">
          <div className="container-denard flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-6 w-6 text-mint-deep" strokeWidth={1.5} />
              <div>
                <h2 className="font-display text-2xl text-ink">Delivery & trusted service</h2>
                <p className="mt-1 max-w-xl text-sm text-ink-soft">
                  Typically within 30 minutes during service hours. Delivery cost and timing are
                  confirmed on WhatsApp with your enquiry reference.
                </p>
              </div>
            </div>
            <Link href="/delivery" className={buttonClassName({ variant: "primary" })}>
              Delivery information
            </Link>
          </div>
        </section>
      ) : null}

      {sectionOn("whatsapp") ? (
        <section className="container-denard py-16 md:py-24">
          <div className="grid items-stretch overflow-hidden border border-line bg-surface md:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mint-deep">
                WhatsApp assistance
              </p>
              <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">
                Prefer to talk it through?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Ask about fit, fabric, availability or delivery. Deep mint marks our service path —
                personal, calm and clear.
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "whatsapp", className: "mt-8 self-start" })}
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>
            <div className="relative min-h-[260px] bg-sand">
              <Image
                src="/images/brand/whatsapp-shopping.svg"
                alt="WhatsApp-assisted shopping with Denard"
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Packaging / trust visual */}
      <section className="border-t border-line bg-ivory py-14">
        <div className="container-denard flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="max-w-md">
            <h2 className="font-display text-3xl text-ink">Thoughtful packaging</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Every order is prepared with care. Presentation that matches the quiet confidence of
              the Denard brand.
            </p>
          </div>
          <div className="relative h-40 w-40 shrink-0 md:h-48 md:w-48">
            <Image src="/images/brand/packaging.svg" alt="Denard packaging" fill className="object-contain" />
          </div>
        </div>
      </section>

      {sectionOn("instagram") ? (
        <InstagramStrip
          tiles={
            newArrivals.items
              .filter((p) => p.images[0]?.url)
              .slice(0, 4)
              .map((p) => ({
                src: p.images[0]!.url,
                alt: p.name,
                href: `/product/${p.slug}`,
              }))
          }
        />
      ) : null}

      <RecentlyViewedRail />

      {sectionOn("newsletter") ? (
        <section className="border-t border-line bg-surface py-16">
          <div className="container-denard max-w-lg">
            <SectionHeader
              title="Stay close to the edit"
              subtitle="Occasional notes on new arrivals and offers. No noise."
            />
            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              action="/api/newsletter"
              method="post"
            >
              <label className="sr-only" htmlFor="newsletter-email">
                Email
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="h-12 flex-1 border border-line bg-ivory px-4 text-sm outline-none focus:border-accent"
              />
              <button type="submit" className={buttonClassName({ variant: "primary" })}>
                Subscribe
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
