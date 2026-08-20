import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("delivery"), "Delivery", "/delivery");
}

export default function DeliveryPage() {
  return (
    <ContentPage
      slug="delivery"
      fallbackTitle="Delivery"
      fallbackBody={`We deliver across the United Kingdom after your enquiry is confirmed on WhatsApp (+44 7887 539426).

Delivery options, courier choice and fees depend on your postcode and the items ordered. All charges are quoted in GBP and approved with you before payment. Typical UK mainland transit is a few working days once dispatched; remote areas or larger parcels may take longer.

Collection or local England arrangements can also be agreed on WhatsApp. International shipping is arranged case by case — contact us with your destination and we will confirm duties, timing and cost before you pay.`}
    />
  );
}
