import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { InstagramStrip } from "@/components/home/instagram-strip";
import { SectionHeader } from "@/components/home/section-header";
import { ProductGrid } from "@/components/product/product-grid";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { ForYouRail } from "@/components/style/for-you-rail";
import { buttonClassName } from "@/components/ui/button";
import { getActiveBanners, getHomepageSections, listProducts } from "@/lib/catalogue";
import { buildPageMetadata } from "@/lib/seo";
import { buildWhatsAppUrl, privateShoppingMessage } from "@/lib/whatsapp";
import { getWhatsAppPhone } from "@/lib/whatsapp-server";
import { shopImageProps } from "@/lib/shop-image";

export const revalidate = 120;

export const metadata: Metadata = buildPageMetadata({
  title: "Timeless style. Distinctly yours.",
  description:
    "Denard — premium African-inspired contemporary fashion and accessories. Curated jewellery, bags and style. Private shopping and card checkout.",
  path: "/",
  image: "/images/products/champagne-tiered-drop-earrings-1.jpeg",
});

const SHOP_COLLECTIONS = [
  {
    label: "Jewellery",
    href: "/category/jewellery",
    image: "/images/products/champagne-tiered-drop-earrings-1.jpeg",
  },
  {
    label: "Crystal Bags",
    href: "/category/accessories",
    image: "/images/products/mint-pave-crescent-hoops-1.jpeg",
  },
  {
    label: "Women",
    href: "/category/women",
    image: "/images/brand/category-women.svg",
  },
  {
    label: "Accessories",
    href: "/category/accessories",
    image: "/images/brand/category-new.svg",
  },
];

const DENARD_EDITS = [
  { title: "The Evening Edit", href: "/shop?isFeatured=1", blurb: "Statement pieces for night" },
  { title: "Wedding Guest", href: "/category/jewellery", blurb: "Polished jewellery & finish" },
  { title: "Statement Jewellery", href: "/category/jewellery", blurb: "Crafted to be noticed" },
  { title: "Gifts Worth Giving", href: "/shop?isOnOffer=1", blurb: "Curated presents" },
];

export default async function HomePage() {
  const [banners, sections, whatsappPhone] = await Promise.all([
    getActiveBanners("home_hero"),
    getHomepageSections(),
    getWhatsAppPhone(),
  ]);

  const sectionOn = (key: string) => sections.find((s) => s.key === key)?.active !== false;

  const [newArrivals, crystalBags] = await Promise.all([
    listProducts({ pageSize: 8, sort: "newest" }),
    listProducts({ categorySlug: "accessories", pageSize: 4, sort: "newest" }),
  ]);

  const hero = banners[0];
  const privateHref = buildWhatsAppUrl(whatsappPhone, privateShoppingMessage());

  const signatureProducts =
    crystalBags.items.length >= 4 ? crystalBags.items : newArrivals.items.slice(0, 4);

  return (
    <div>
      {/* 1. Hero */}
      {sectionOn("hero") ? (
        <Hero
          title={hero?.title ?? "Timeless style. Distinctly yours."}
          subtitle={
            hero?.subtitle ??
            "Contemporary fashion and accessories, curated in Britain for a global audience. Distinctive pieces. Thoughtfully curated."
          }
          imageSrc="/images/products/champagne-tiered-drop-earrings-1.jpeg"
          imageSrcMobile="/images/products/mint-pave-crescent-hoops-1.jpeg"
          imageAlt="Denard campaign"
          videoSrc="/videos/necklace.mp4"
          shopHref={hero?.linkUrl ?? "/new-arrivals"}
          whatsappPhone={whatsappPhone}
        />
      ) : null}

      {/* 2. New Arrivals */}
      {sectionOn("new_arrivals") ? (
        <section className="bg-surface py-16 md:py-24">
          <div className="container-denard">
            <SectionHeader
              title="New at Denard"
              subtitle="Freshly curated pieces for the season."
              href="/new-arrivals"
            />
            <div className="mt-8">
              <ProductGrid products={newArrivals.items.slice(0, 8)} />
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. Shop by Collection — editorial cards */}
      <section className="border-y border-line bg-line">
        <div className="bg-canvas px-4 py-10 md:px-8 md:py-12">
          <div className="container-denard">
            <SectionHeader
              title="Shop by collection"
              subtitle="Fashion, jewellery, bags and accessories — fewer categories, stronger focus."
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px md:grid-cols-4">
          {SHOP_COLLECTIONS.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative aspect-[4/5] overflow-hidden bg-ivory sm:aspect-square md:aspect-[3/4]"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width:768px) 50vw, 25vw"
                {...shopImageProps(cat.image)}
              />
              <div className="absolute inset-0 bg-ink/35 transition group-hover:bg-ink/45" />
              <span className="absolute inset-x-0 bottom-0 p-4 font-display text-2xl text-white md:text-3xl">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Signature Collection */}
      <section className="container-denard py-16 md:py-24">
        <div className="grid items-end gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
              Signature
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">The Crystal Collection</h2>
            <p className="mt-3 max-w-lg text-sm text-ink-soft md:text-base">
              Light-catching pieces and evening accessories — a campaign edit, not a marketplace dump.
            </p>
          </div>
          <div className="md:text-right">
            <Link href="/category/accessories" className={buttonClassName({ variant: "outline" })}>
              Explore the collection
            </Link>
          </div>
        </div>
        <div className="mt-10">
          <ProductGrid products={signatureProducts} />
        </div>
      </section>

      {/* 5. The Denard Edit */}
      <section className="border-t border-line bg-surface py-16 md:py-24">
        <div className="container-denard">
          <SectionHeader
            title="The Denard Edit"
            subtitle="Curated looks — discover, then refine with The Denard Stylist."
            href="/style"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DENARD_EDITS.map((edit) => (
              <Link
                key={edit.title}
                href={edit.href}
                className="group border border-line bg-canvas p-6 transition hover:border-mint-deep"
              >
                <h3 className="font-display text-xl text-ink group-hover:text-mint-deep">{edit.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{edit.blurb}</p>
                <span className="mt-4 inline-block text-xs uppercase tracking-[0.12em] text-gold">
                  View edit
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Personal Shopping */}
      <section className="container-denard py-16 md:py-24">
        <div className="grid items-stretch overflow-hidden border border-line bg-canvas md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mint-deep">
              Private shopping
            </p>
            <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">Need help choosing?</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base">
              Our private shopping service can help you choose, combine and secure your preferred
              pieces — with the calm of a personal shopper, not a support desk.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={privateHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "whatsapp" })}
              >
                Speak to a Style Adviser
              </a>
              <Link href="/style" className={buttonClassName({ variant: "outline" })}>
                The Denard Stylist
              </Link>
            </div>
          </div>
          <div className="relative min-h-[260px] bg-sand">
            <Image
              src="/images/brand/whatsapp-shopping.svg"
              alt="Denard private shopping"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* 7. Our Story / Founder */}
      <section className="border-t border-line bg-ivory py-16 md:py-24">
        <div className="container-denard grid items-center gap-10 md:grid-cols-2 md:gap-16">
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
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
              Meet the founder
            </p>
            <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">Adeola Hassan</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft md:text-base">
              Accountant by profession, fashion entrepreneur by passion. Adeola founded Denard around
              a belief that beautifully crafted fashion should feel personal, distinctive and
              accessible to customers who value style and detail.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Discover. Curate. Connect. — browse the edit, refine with The Denard Stylist, then
              complete via card or private shopping.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className={buttonClassName({ variant: "primary" })}>
                Discover Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Denard — factual benefits instead of illustrative testimonials */}
      <section className="border-t border-line bg-surface py-14 md:py-16">
        <div className="container-denard">
          <SectionHeader
            title="Why customers choose Denard"
            subtitle="Accessible premium — strong presentation, personal service and curated pieces without luxury-house intimidation."
          />
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Curated, not crowded",
                body: "Fashion, jewellery, bags and accessories — selected with intention.",
              },
              {
                title: "Private shopping",
                body: "A Style Adviser on WhatsApp to help you choose, combine and secure pieces.",
              },
              {
                title: "Pay your way",
                body: "Card checkout on site, or enquire and pay with a secure link when ready.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-xl text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ForYouRail title="Your Denard Edit" />
      <RecentlyViewedRail />

      {/* 8. Instagram + newsletter */}
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

      {sectionOn("newsletter") ? (
        <section className="border-t border-line bg-canvas py-16">
          <div className="container-denard max-w-lg">
            <SectionHeader
              title="Stay close to the edit"
              subtitle="Occasional notes on new arrivals. No noise."
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
