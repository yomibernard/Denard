import type { MetadataRoute } from "next";

function siteBase() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return "https://denard.co.uk";
}

export default function robots(): MetadataRoute.Robots {
  const base = siteBase();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/design-system", "/admin"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
