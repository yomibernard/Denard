import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("about"), "About Denard", "/about");
}

export default function AboutPage() {
  return (
    <ContentPage
      slug="about"
      fallbackTitle="About Denard"
      fallbackBody={`Denard is a contemporary fashion house based in England, United Kingdom. We curate jewellery and ready-to-wear pieces for everyday elegance — browse the catalogue online, then complete your order through a personal conversation with our team.

Every enquiry is handled on WhatsApp (+44 7887 539426). We confirm availability, pricing in GBP, payment and delivery before you commit. No anonymous checkout — just guided, human service from England.`}
    />
  );
}
