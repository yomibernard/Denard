import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("terms"), "Terms", "/terms");
}

export default function TermsPage() {
  return (
    <ContentPage
      slug="terms"
      fallbackTitle="Terms of use"
      fallbackBody="Catalogue browsing and WhatsApp enquiries do not create a binding purchase until availability and payment are confirmed with Denard. Product details may change. Use of this site must comply with applicable law."
    />
  );
}
