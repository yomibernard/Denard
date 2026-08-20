import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("returns"), "Returns", "/returns");
}

export default function ReturnsPage() {
  return (
    <ContentPage
      slug="returns"
      fallbackTitle="Returns"
      fallbackBody={`UK returns are handled personally on WhatsApp (+44 7887 539426). Keep your enquiry reference ready when you contact us.

Eligible unused items in original condition may be returned within the window agreed at fulfilment. Refunds or exchanges are confirmed in GBP once we receive and inspect the goods. Return postage arrangements are agreed per order.

Nothing here limits your statutory rights under the Consumer Rights Act 2015. Faulty or misdescribed goods should be reported promptly so we can arrange a repair, replacement or refund as appropriate.`}
    />
  );
}
