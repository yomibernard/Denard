import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Denard";
const DEFAULT_OG = "/images/brand/campaign-new-arrivals.svg";

export type PageSeoInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const desc =
    description?.trim() ||
    "Denard is a premium contemporary fashion house based in England, UK. Enquire on WhatsApp.";
  const ogImage = absoluteUrl(image || DEFAULT_OG);

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: SITE_NAME,
      title,
      description: desc,
      url,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function organizationJsonLd(opts: {
  phone?: string;
  email?: string;
  address?: string;
}) {
  const telephone = opts.phone?.replace(/\s/g, "") || undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/images/brand/logos/icon.png"),
    email: opts.email || "hello@denard.co.uk",
    telephone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "England",
      addressCountry: "GB",
      streetAddress: opts.address || "England, United Kingdom",
    },
    sameAs: [],
  };
}

export function localBusinessJsonLd(opts: {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
}) {
  const telephone = opts.phone?.replace(/\s/g, "") || undefined;
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    image: absoluteUrl(DEFAULT_OG),
    telephone,
    email: opts.email || "hello@denard.co.uk",
    address: {
      "@type": "PostalAddress",
      addressLocality: "England",
      addressCountry: "GB",
      streetAddress: opts.address || "England, United Kingdom",
    },
    priceRange: "££",
    openingHours: opts.hours || "Mo-Sa 09:00-18:00",
  };
}

export function websiteSearchActionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/shop?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
