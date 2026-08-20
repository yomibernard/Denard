import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("privacy"), "Privacy policy", "/privacy");
}

export default function PrivacyPage() {
  return (
    <ContentPage
      slug="privacy"
      fallbackTitle="Privacy policy"
      fallbackBody={`Denard (England, United Kingdom) respects your privacy under UK GDPR and the Data Protection Act 2018.

What we collect
We collect the information you provide for enquiries — typically your name, phone number, email, delivery notes and message content — so we can respond on WhatsApp (+44 7887 539426) and fulfil your request. Site analytics may record anonymous usage data.

How we use it
Data is used only to answer enquiries, confirm orders in GBP, arrange delivery, and improve our service. We do not sell your personal data. Messages may be stored on WhatsApp under Meta’s terms.

Your rights
You may request access, correction, deletion, or restriction of your personal data, and you may complain to the ICO. Contact us on WhatsApp (+44 7887 539426) or email hello@denard.co.uk to exercise these rights.

Retention
We keep enquiry records for as long as needed to complete your order and meet legal or accounting obligations, then delete or anonymise them.`}
    />
  );
}
