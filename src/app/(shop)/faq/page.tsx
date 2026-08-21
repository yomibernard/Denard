import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";
import { faqPageJsonLd } from "@/lib/seo";

export const revalidate = 3600;

const FAQ_FALLBACK = `Q: Do you take online payments on the website?
A: Not in this phase. After your enquiry, our team confirms availability and shares secure payment instructions on WhatsApp. We never ask for card details via the public site forms.

Q: How does WhatsApp ordering work?
A: Browse products, choose colour/size where needed, add items to your enquiry basket, then send. You receive a DEN-YEAR-###### reference so you can track the conversation.

Q: Are prices final?
A: Displayed prices are a guide in GBP. Final totals may include delivery or stock changes confirmed with you before payment.

Q: Can I track my enquiry?
A: Yes — use Track enquiry with your DEN-YEAR-###### reference and the phone number you submitted.`;

function parseFaqPairs(body: string) {
  const pairs: Array<{ question: string; answer: string }> = [];
  const blocks = body.split(/\n(?=Q:\s*)/i);
  for (const block of blocks) {
    const qm = block.match(/Q:\s*([\s\S]*?)\nA:\s*([\s\S]*)/i);
    if (qm) {
      pairs.push({
        question: qm[1].trim(),
        answer: qm[2].trim(),
      });
    }
  }
  return pairs;
}

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("faq"), "FAQ", "/faq");
}

export default async function FaqPage() {
  const page = await getPageContent("faq");
  const faqs = parseFaqPairs(page?.body ?? FAQ_FALLBACK);
  const schema = faqPageJsonLd(
    faqs.length
      ? faqs
      : [
          {
            question: "Do you take online payments on the website?",
            answer:
              "Not in this phase. Payment details are shared securely through WhatsApp after availability is confirmed.",
          },
        ],
  );

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
