/**
 * Update WhatsApp / business phone + ensure jewellery taxonomy + deepen CMS pages.
 * Run: npx tsx scripts/update-phone.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const WHATSAPP = process.env.WHATSAPP_PHONE ?? "447887539426";
const BUSINESS = "+44 7887 539426";

const PAGES: Array<{ slug: string; title: string; body: string; seoTitle?: string; seoDescription?: string }> = [
  {
    slug: "about",
    title: "About Denard",
    seoTitle: "About Denard | Fashion & jewellery from England",
    seoDescription:
      "Denard is a premium contemporary fashion house in England, UK — curated jewellery and fashion with WhatsApp-assisted shopping.",
    body: `Denard is a premium contemporary fashion company based in England, United Kingdom. We help customers discover quality jewellery and fashion online, then complete their purchase with personal guidance on WhatsApp — honest information, careful fulfilment, and service that feels human.

Our catalogue focuses on timeless style, considered materials and accessible elegance. Whether you are dressing for work, evenings or everyday polish, we curate pieces that last beyond a single season.

Visit or message us during service hours (typically Mon–Sat, 09:00–18:00 GMT). WhatsApp ${BUSINESS} · hello@denard.co.uk · England, United Kingdom.`,
  },
  {
    slug: "delivery",
    title: "Delivery",
    seoTitle: "UK delivery | Denard",
    seoDescription: "How Denard confirms UK delivery cost and timing on WhatsApp after your enquiry.",
    body: `Delivery options and timelines are confirmed with you on WhatsApp after your enquiry. We serve addresses across the United Kingdom and can arrange courier delivery depending on your location and product type.

You will always receive clear cost and timing before payment. Fragile jewellery may use extra protective packaging. International delivery is arranged case by case — ask on WhatsApp (${BUSINESS}) for a quote.

Track progress with your DEN-YEAR-###### enquiry reference on the Track page.`,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    seoTitle: "FAQ | Denard WhatsApp shopping",
    seoDescription: "Payments, delivery, returns, sizing and tracking answers for Denard customers in the UK.",
    body: `Q: Do I pay on the website?
A: Not in this phase. Secure payment instructions are shared on WhatsApp after availability is confirmed. We do not collect card details through site forms.

Q: How fast will you respond?
A: During service hours (Mon–Sat, 09:00–18:00 GMT) we typically respond within 30 minutes.

Q: Can I order multiple products?
A: Yes. Use the enquiry basket and send one combined WhatsApp request.

Q: Are prices in pounds?
A: Yes — GBP. Final totals including delivery are confirmed before you pay.

Q: How do returns work?
A: Eligible unused items can be returned or exchanged via WhatsApp with your enquiry reference. See our Returns page.

Q: Can I track my enquiry?
A: Yes — use Track enquiry with your DEN-YEAR-###### reference and phone number.`,
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    seoTitle: "Privacy policy | Denard",
    seoDescription: "How Denard processes personal data for enquiries under UK GDPR.",
    body: `We collect only the information needed to process your enquiry — such as your name, phone number, email and delivery notes. We use this to respond on WhatsApp, fulfil orders and improve our service.

We do not sell your personal data. Analytics cookies load only after you accept our cookie banner. Newsletter signup is optional.

Under UK GDPR you may request access, correction or deletion of your data. Contact ${BUSINESS} or hello@denard.co.uk. We retain enquiry records only as long as needed for fulfilment and legal obligations.

Last updated: August 2026.`,
  },
  {
    slug: "returns",
    title: "Returns & exchanges",
    seoTitle: "Returns & exchanges | Denard",
    seoDescription: "UK returns and exchanges for Denard WhatsApp orders.",
    body: `Eligible returns and exchanges are arranged through WhatsApp with your enquiry reference. Items must be unused and in original condition unless otherwise agreed.

Your statutory rights under the Consumer Rights Act 2015 are unaffected. If goods are faulty or not as described, contact us promptly for a remedy.

Specific return windows depend on product category and are confirmed at purchase. Message ${BUSINESS} to start a return.`,
  },
  {
    slug: "contact",
    title: "Contact",
    body: `Message us on WhatsApp at ${BUSINESS}, email hello@denard.co.uk, or visit us in England, United Kingdom during service hours. We are here to help with product questions, availability and fulfilment.`,
  },
];

async function main() {
  for (const [key, value] of [
    ["whatsapp_phone", WHATSAPP],
    ["business_phone", BUSINESS],
  ] as const) {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    console.log(`Updated ${key} → ${value}`);
  }

  let fashion = await prisma.department.findUnique({ where: { slug: "fashion" } });
  if (!fashion) {
    fashion = await prisma.department.create({
      data: {
        name: "Fashion",
        slug: "fashion",
        description: "Refined fashion and accessories.",
        featured: true,
        sortOrder: 1,
        active: true,
      },
    });
  }

  let accessories = await prisma.category.findUnique({ where: { slug: "accessories" } });
  if (!accessories) {
    accessories = await prisma.category.create({
      data: {
        name: "Accessories",
        slug: "accessories",
        description: "Jewellery and finishing pieces curated by Denard.",
        departmentId: fashion.id,
        featured: true,
        sortOrder: 10,
        active: true,
        seoTitle: "Accessories | Denard",
        seoDescription: "Shop Denard accessories and finishing pieces.",
      },
    });
    console.log("Created category accessories");
  } else {
    await prisma.category.update({
      where: { id: accessories.id },
      data: { active: true, featured: true },
    });
  }

  let jewellery = await prisma.category.findUnique({ where: { slug: "jewellery" } });
  if (!jewellery) {
    jewellery = await prisma.category.create({
      data: {
        name: "Jewellery",
        slug: "jewellery",
        description: "Earrings, sets and statement pieces.",
        departmentId: fashion.id,
        parentId: accessories.id,
        featured: true,
        sortOrder: 1,
        active: true,
        seoTitle: "Jewellery | Denard",
        seoDescription: "Shop Denard jewellery — earrings and curated sets.",
      },
    });
    console.log("Created category jewellery");
  } else {
    await prisma.category.update({
      where: { id: jewellery.id },
      data: { active: true, featured: true },
    });
  }

  for (const page of PAGES) {
    await prisma.pageContent.upsert({
      where: { slug: page.slug },
      create: {
        slug: page.slug,
        title: page.title,
        body: page.body,
        seoTitle: page.seoTitle ?? page.title,
        seoDescription: page.seoDescription ?? null,
      },
      update: {
        title: page.title,
        body: page.body,
        seoTitle: page.seoTitle ?? page.title,
        seoDescription: page.seoDescription ?? null,
      },
    });
    console.log(`Updated page ${page.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
