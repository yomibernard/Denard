import type { Metadata } from "next";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import {
  localBusinessJsonLd,
  organizationJsonLd,
  websiteSearchActionJsonLd,
} from "@/lib/seo";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return "https://denard.co.uk";
})();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Denard — Timeless style, curated for life.",
    template: "%s | Denard",
  },
  description:
    "Denard is a premium contemporary fashion house based in England, UK. Discover curated collections and complete your enquiry on WhatsApp.",
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Denard",
    title: "Denard — Timeless style, curated for life.",
    description: "Premium contemporary fashion from England, UK — WhatsApp-assisted shopping.",
    url: siteUrl,
    images: [{ url: "/images/brand/campaign-new-arrivals.svg", alt: "Denard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Denard — Timeless style, curated for life.",
    description: "Premium contemporary fashion from England, UK — WhatsApp-assisted shopping.",
    images: ["/images/brand/campaign-new-arrivals.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/images/brand/logos/icon-light.png" },
      { url: "/images/brand/logos/icon.png" },
    ],
    apple: [{ url: "/images/brand/logos/icon.png" }],
  },
};

const orgLd = organizationJsonLd({
  phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    ? `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}`
    : process.env.NEXT_PUBLIC_WHATSAPP_PHONE
      ? `+${process.env.NEXT_PUBLIC_WHATSAPP_PHONE.replace(/\D/g, "")}`
      : "+447887539426",
  email: "hello@denard.co.uk",
  address: "England, United Kingdom",
});

const localLd = localBusinessJsonLd({
  phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    ? `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}`
    : process.env.NEXT_PUBLIC_WHATSAPP_PHONE
      ? `+${process.env.NEXT_PUBLIC_WHATSAPP_PHONE.replace(/\D/g, "")}`
      : "+447887539426",
  email: "hello@denard.co.uk",
  address: "England, United Kingdom",
  hours: "Mo-Sa 09:00-18:00",
});

const siteLd = websiteSearchActionJsonLd();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
        <CookieConsent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
      </body>
    </html>
  );
}
