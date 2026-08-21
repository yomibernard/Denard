import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/product/breadcrumbs";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export type ContentPageProps = {
  slug: string;
  fallbackTitle: string;
  fallbackBody?: string;
};

export async function getPageContent(slug: string) {
  return prisma.pageContent.findUnique({ where: { slug } });
}

export function contentMetadata(
  page: { title: string; seoTitle: string | null; seoDescription: string | null } | null,
  fallbackTitle: string,
  path: string,
): Metadata {
  const title = page?.seoTitle || page?.title || fallbackTitle;
  const description = page?.seoDescription || undefined;
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Denard",
      locale: "en_GB",
      type: "website",
      images: [{ url: absoluteUrl("/images/brand/campaign-new-arrivals.svg") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/images/brand/campaign-new-arrivals.svg")],
    },
  };
}

export async function ContentPage({
  slug,
  fallbackTitle,
  fallbackBody,
}: ContentPageProps) {
  const page = await getPageContent(slug);
  if (!page && !fallbackBody) notFound();

  const title = page?.title ?? fallbackTitle;
  const body = page?.body ?? fallbackBody ?? "";
  const updatedAt = page?.updatedAt
    ? page.updatedAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "August 2026";

  return (
    <article className="container-denard py-8 md:py-12 max-w-3xl">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: title }]}
        className="mb-5"
      />
      <h1 className="font-display text-3xl md:text-4xl text-ink">{title}</h1>
      <p className="mt-2 text-xs text-muted">Last updated: {updatedAt}</p>
      <div className="mt-6 space-y-4 text-ink-soft whitespace-pre-wrap leading-relaxed">
        {body}
      </div>
    </article>
  );
}
