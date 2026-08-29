import Link from "next/link";
import { cn } from "@/lib/utils";
import { DenardLogo } from "@/components/brand/denard-logo";
import { buildWhatsAppUrl, generalAssistanceMessage } from "@/lib/whatsapp";

const HELP_LINKS = [
  { href: "/style", label: "Style profile" },
  { href: "/how-to-order", label: "How to order" },
  { href: "/delivery", label: "Delivery" },
  { href: "/returns", label: "Returns" },
  { href: "/faq", label: "FAQs" },
  { href: "/track", label: "Track enquiry" },
  { href: "/contact", label: "Contact" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export type FooterProps = {
  className?: string;
  email?: string;
  phone?: string;
  whatsappPhone?: string;
  address?: string;
  serviceHours?: string;
  departments?: Array<{ name: string; slug: string }>;
};

function formatDisplayPhone(digits: string) {
  const clean = digits.replace(/\D/g, "");
  if (clean.startsWith("44") && clean.length >= 12) {
    return `+${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6)}`;
  }
  return digits.startsWith("+") ? digits : `+${clean}`;
}

export function Footer({
  className,
  email = "hello@denard.co.uk",
  phone = "+44 7887 539426",
  whatsappPhone = "447887539426",
  address = "England, United Kingdom",
  serviceHours,
  departments = [],
}: FooterProps) {
  const year = new Date().getFullYear();
  const waDigits = (whatsappPhone || phone).replace(/\D/g, "");
  const waHref = waDigits
    ? buildWhatsAppUrl(waDigits, generalAssistanceMessage())
    : undefined;
  const waLabel = formatDisplayPhone(waDigits || phone);

  return (
    <footer className={cn("mt-auto border-t border-line bg-ink text-white", className)}>
      <div className="container-denard grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <DenardLogo variant="slogan" href="/" onDark className="!h-28 w-auto md:!h-36" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Premium contemporary fashion from England, UK — timeless style, curated products and
            accessible elegance, with WhatsApp-assisted shopping.
          </p>
          {serviceHours ? (
            <p className="mt-4 text-xs text-white/50">Service hours: {serviceHours}</p>
          ) : null}
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>
              <Link href="/shop" className="hover:text-white">
                All products
              </Link>
            </li>
            <li>
              <Link href="/new-arrivals" className="hover:text-white">
                New arrivals
              </Link>
            </li>
            <li>
              <Link href="/best-sellers" className="hover:text-white">
                Best sellers
              </Link>
            </li>
            <li>
              <Link href="/offers" className="hover:text-white">
                Offers
              </Link>
            </li>
            {departments.map((d) => (
              <li key={d.slug}>
                <Link href={`/department/${d.slug}`} className="hover:text-white">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">Help</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
            Contact
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>
              <a href={`mailto:${email}`} className="hover:text-white">
                {email}
              </a>
            </li>
            {phone ? (
              <li>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">
                  {phone}
                </a>
              </li>
            ) : null}
            {waHref ? (
              <li>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp {waLabel}
                </a>
              </li>
            ) : null}
            {address ? <li>{address}</li> : null}
            <li>
              <Link href="/about" className="hover:text-white">
                About Denard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-denard flex flex-col gap-3 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Denard. England, United Kingdom. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white/80">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
