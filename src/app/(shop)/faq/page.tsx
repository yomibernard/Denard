import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";
import { faqPageJsonLd } from "@/lib/seo";

export const revalidate = 3600;

const FAQ_FALLBACK = `Q: Do you take online payments on the website?
A: Yes — when card checkout is enabled, you can pay securely by card from Your bag via Stripe. You can also send an enquiry on WhatsApp and pay later (including a payment link we send you). Never type card numbers into WhatsApp chat or public enquiry forms.

Q: How does WhatsApp ordering work?
A: Browse products, choose colour/size where needed, add items to your bag, then Send on WhatsApp. You receive a DEN-YEAR-###### reference so you can track the conversation.

Q: Are prices final?
A: Displayed prices are a guide in GBP. Delivery or stock changes may adjust the total — confirmed at card checkout or on WhatsApp before you pay offline.

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
              "Yes — pay by card from Your bag when checkout is available, or enquire on WhatsApp for a secure payment link.",
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
