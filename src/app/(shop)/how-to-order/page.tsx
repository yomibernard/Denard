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
3. Add items to your bag (or enquire on a single product).
4. Open Your bag and enter your details.
5. Pay securely by card on the site (when card checkout is available), or send on WhatsApp (+44 7887 539426) for personal guidance.
6. Keep your DEN- reference to track fulfilment. Delivery timing is confirmed after payment or in chat.`}
    />
  );
}
