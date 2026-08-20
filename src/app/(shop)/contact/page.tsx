import type { Metadata } from "next";
import { ContentPage, contentMetadata, getPageContent } from "@/components/content/content-page";
import { getSiteSetting } from "@/lib/catalogue";
import { buildWhatsAppUrl, generalAssistanceMessage } from "@/lib/whatsapp";
import { getWhatsAppPhone } from "@/lib/whatsapp-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata(await getPageContent("contact"), "Contact", "/contact");
}

export default async function ContactPage() {
  const [phone, email, address, wa] = await Promise.all([
    getSiteSetting("business_phone", "+44 7887 539426"),
    getSiteSetting("business_email", "hello@denard.co.uk"),
    getSiteSetting("business_address", "England, United Kingdom"),
    getWhatsAppPhone(),
  ]);

  const fallback = [
    "We are happiest on WhatsApp for product questions and orders.",
    "",
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Address: ${address}`,
    wa ? `\nWhatsApp: https://wa.me/${wa.replace(/\D/g, "")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div>
      <ContentPage slug="contact" fallbackTitle="Contact" fallbackBody={fallback} />
      {wa ? (
        <div className="container-denard max-w-3xl pb-12 -mt-4">
          <a
            href={buildWhatsAppUrl(wa, generalAssistanceMessage())}
            className="text-sm font-medium text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Message us on WhatsApp →
          </a>
        </div>
      ) : null}
    </div>
  );
}
