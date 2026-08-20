import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/button";
import { buildWhatsAppUrl, generalAssistanceMessage } from "@/lib/whatsapp";

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
 * Split hero: copy + media, shared baseline, no floating inset media.
 */
export function Hero({
  title = "Timeless style. Accessible elegance.",
  subtitle = "Curated contemporary fashion — designed for confidence, finished with personal WhatsApp service.",
  imageSrc = "/images/products/champagne-tiered-drop-earrings-1.jpeg",
  imageSrcMobile = "/images/products/mint-pave-crescent-hoops-1.jpeg",
  imageAlt = "Denard jewellery edit",
  videoSrc,
  shopHref = "/shop",
  whatsappPhone = "",
  promo,
  className,
}: HeroProps) {
  const waHref = whatsappPhone
    ? buildWhatsAppUrl(whatsappPhone, generalAssistanceMessage())
    : undefined;

  return (
    <section
      className={cn("relative isolate w-full overflow-hidden border-b border-line bg-ivory", className)}
    >
      <div className="container-denard grid items-center gap-8 py-10 md:grid-cols-2 md:gap-12 md:py-14 lg:gap-16 lg:py-16">
        <div className="relative z-10 flex max-w-xl flex-col justify-center animate-fade-up">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
            Contemporary fashion
          </p>

          <h1 className="mt-4 font-display text-3xl font-normal leading-[1.15] text-ink sm:text-4xl md:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft sm:text-base">{subtitle}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={shopHref} className={buttonClassName({ variant: "primary", size: "lg" })}>
              Shop Products
            </Link>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: "outline", size: "lg" })}
              >
                <MessageCircle className="h-4 w-4 text-mint-deep" strokeWidth={1.75} />
                Chat on WhatsApp
              </a>
            ) : null}
          </div>

          {promo ? (
            <p className="mt-8 border-t border-gold/40 pt-4 text-xs leading-relaxed tracking-wide text-muted">
              {promo}
            </p>
          ) : null}
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand sm:aspect-[5/6] md:aspect-auto md:min-h-[520px] lg:min-h-[560px]">
          {videoSrc ? (
            <video
              className="absolute inset-0 h-full w-full object-cover object-center"
              autoPlay
              muted
              loop
              playsInline
              poster={imageSrc}
              aria-label={imageAlt}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            <>
              <Image
                src={imageSrcMobile}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-cover object-center md:hidden"
              />
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                sizes="50vw"
                className="hidden object-cover object-center md:block"
              />
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/55 to-transparent p-4 md:p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-gold">Jewellery edit</p>
            <p className="mt-1 font-display text-lg text-white md:text-xl">New arrivals in store</p>
          </div>
        </div>
      </div>
    </section>
  );
}
