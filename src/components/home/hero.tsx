import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/button";
import { buildWhatsAppUrl, privateShoppingMessage } from "@/lib/whatsapp";
import { MediaVideo } from "@/components/home/media-video";
import { shopImageProps } from "@/lib/shop-image";

export type HeroProps = {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageSrcMobile?: string;
  imageAlt?: string;
  videoSrc?: string;
  shopHref?: string;
  whatsappPhone?: string;
  promo?: string | null;
  className?: string;
};

/**
 * Brand-led hero: aspiration first. Private Shopping is secondary — no operational WhatsApp copy.
 */
export function Hero({
  title = "Timeless style. Distinctly yours.",
  subtitle = "Premium African-inspired contemporary fashion and accessories — curated for confidence, crafted to be remembered.",
  imageSrc = "/images/products/champagne-tiered-drop-earrings-1.jpeg",
  imageSrcMobile = "/images/products/mint-pave-crescent-hoops-1.jpeg",
  imageAlt = "Denard campaign",
  videoSrc,
  shopHref = "/new-arrivals",
  whatsappPhone = "",
  promo,
  className,
}: HeroProps) {
  const privateHref = whatsappPhone
    ? buildWhatsAppUrl(whatsappPhone, privateShoppingMessage())
    : undefined;

  return (
    <section
      className={cn("relative isolate w-full overflow-hidden border-b border-line bg-ivory", className)}
    >
      <div className="container-denard grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-14 lg:gap-16 lg:py-16">
        <div className="relative z-10 flex max-w-xl flex-col justify-center animate-fade-up">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">Denard</p>

          <h1 className="mt-4 font-display text-3xl font-normal leading-[1.15] text-ink sm:text-4xl md:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">{subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={shopHref} className={buttonClassName({ variant: "primary", size: "lg" })}>
              Explore New Arrivals
            </Link>
            {privateHref ? (
              <a
                href={privateHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "outline", size: "lg" })}
              >
                Private Shopping
              </a>
            ) : (
              <Link href="/style" className={buttonClassName({ variant: "outline", size: "lg" })}>
                The Denard Stylist
              </Link>
            )}
          </div>

          {promo ? (
            <p className="mt-8 border-t border-gold/40 pt-4 text-xs leading-relaxed tracking-wide text-muted">
              {promo}
            </p>
          ) : null}
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand sm:aspect-[5/6] md:aspect-auto md:min-h-[520px] lg:min-h-[560px]">
          {videoSrc ? (
            <MediaVideo src={videoSrc} poster={imageSrc} label={imageAlt} />
          ) : (
            <>
              <Image
                src={imageSrcMobile}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-cover object-center md:hidden"
                {...shopImageProps(imageSrcMobile)}
              />
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                sizes="50vw"
                className="hidden object-cover object-center md:block"
                {...shopImageProps(imageSrc)}
              />
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/55 to-transparent p-4 md:p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-gold">Crafted distinction</p>
            <p className="mt-1 font-display text-lg text-white md:text-xl">
              Distinctive pieces. Thoughtfully curated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
