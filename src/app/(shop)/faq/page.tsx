import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";
import { faqPageJsonLd } from "@/lib/seo";

export const revalidate = 3600;

const FAQ_FALLBACK = `Do you take online payments on the website?
Not in this phase. After your enquiry, our team confirms availability and shares secure payment instructions on WhatsApp. We never ask for card details via the public site forms.

How does WhatsApp ordering work?
Browse products, choose colour/size where needed, add items to your enquiry basket, then send. You receive a DEN-YEAR-###### reference so you can track the conversation.

Are prices final?
Displayed prices are a guide in GBP. Final totals may include delivery or stock changes confirmed with you before payment.

What about delivery across the UK?
We arrange UK delivery after confirming your address on WhatsApp. Cost and timing depend on courier and location — you approve before paying.

Can I return or exchange?
Yes for eligible unused items in original condition. Contact us on WhatsApp with your enquiry reference within the window agreed at purchase. See Returns for detail.

Do you ship internationally?
International options are arranged case by case on WhatsApp. Duties and longer transit times may apply.

How do I know jewellery materials and authenticity?
Product pages describe finishes and materials. Ask on WhatsApp for care advice, plating details or gift packaging.

Can I track my enquiry?
Yes — use Track enquiry with your DEN-YEAR-###### reference and the phone number you submitted.

What are your service hours?
Typically Monday–Saturday, 09:00–18:00 GMT. Messages outside hours are answered on the next working day.`;

const FAQS = [
  {
    question: "Do you take online payments on the website?",
    answer:
      "Not in this phase. After your enquiry, our team confirms availability and shares secure payment instructions on WhatsApp. We never ask for card details via the public site forms.",
  },
  {
    question: "How does WhatsApp ordering work?",
    answer:
      "Browse products, choose colour/size where needed, add items to your enquiry basket, then send. You receive a DEN-YEAR-###### reference so you can track the conversation.",
  },
  {
    question: "Are prices final?",
    answer:
      "Displayed prices are a guide in GBP. Final totals may include delivery or stock changes confirmed with you before payment.",
  },
  {
    question: "What about delivery across the UK?",
    answer:
      "We arrange UK delivery after confirming your address on WhatsApp. Cost and timing depend on courier and location — you approve before paying.",
  },
  {
    question: "Can I return or exchange?",
    answer:
      "Yes for eligible unused items in original condition. Contact us on WhatsApp with your enquiry reference within the window agreed at purchase.",
  },
  {
    question: "Can I track my enquiry?",
    answer:
      "Yes — use Track enquiry with your DEN-YEAR-###### reference and the phone number you submitted.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("faq"), "FAQ", "/faq");
}

export default function FaqPage() {
  const schema = faqPageJsonLd(FAQS);
  return (
    <>
      <ContentPage slug="faq" fallbackTitle="FAQ" fallbackBody={FAQ_FALLBACK} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}
