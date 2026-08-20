import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("how-to-order"), "How to order", "/how-to-order");
}

export default function HowToOrderPage() {
  return (
    <ContentPage
      slug="how-to-order"
      fallbackTitle="How to order"
      fallbackBody={`1. Browse the catalogue and open a product.
2. Choose colour, size and quantity where required.
3. Add items to your enquiry basket, or message us directly on WhatsApp (+44 7887 539426).
4. Submit your details — we open WhatsApp with your enquiry reference.
5. Confirm availability, payment (GBP) and UK delivery with our team.`}
    />
  );
}
