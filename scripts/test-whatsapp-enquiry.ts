/**
 * Smoke tests for WhatsApp enquiry message builders.
 * Run: npx tsx scripts/test-whatsapp-enquiry.ts
 */
import {
  buildMultiProductMessage,
  buildSingleProductMessage,
  buildWhatsAppEnquiryUrl,
  buildWhatsAppUrl,
} from "../src/lib/whatsapp";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const product = {
  name: "Gold Bead Necklace",
  sku: "DEN-NECK-001",
  colour: "Gold",
  size: "One Size",
  variant: "Classic",
  quantity: 2,
  unitPrice: 45,
  compareAtPrice: 60,
  currency: "GBP",
  url: "https://denard.example/product/gold-bead",
};

const single = buildSingleProductMessage({
  product,
  intendedAction: "ENQUIRY",
  note: "Gift wrap please",
  reference: "DEN-2026-000145",
});

assert(single.includes("Hello Denard,"), "greeting");
assert(single.includes("Product: Gold Bead Necklace"), "name");
assert(single.includes("Enquiry Reference: DEN-2026-000145"), "reference");
assert(single.includes("I would like to: Make an Enquiry"), "action");
assert(!single.includes("Colour: null"), "no null colour");
assert(single.includes("was"), "discount shown");

const emptyColour = buildSingleProductMessage({
  product: { ...product, colour: null, size: undefined, variant: "" },
  intendedAction: "PAYMENT",
  reference: "DEN-2026-000146",
});
assert(!emptyColour.includes("Colour:"), "omit empty colour");
assert(!emptyColour.includes("Size:"), "omit empty size");
assert(!emptyColour.includes("Variant:"), "omit empty variant");
assert(emptyColour.includes("Complete Payment"), "payment action");

const multi = buildMultiProductMessage({
  products: [product, { ...product, name: "Silver Ring", sku: "DEN-RING-002", quantity: 1 }],
  customer: {
    name: "Ada Lovelace",
    phone: "+447700900123",
    city: "London",
    country: "United Kingdom",
    note: "ASAP",
  },
  intendedAction: "PAYMENT",
  reference: "DEN-2026-000147",
  estimatedTotal: 135,
});
assert(multi.includes("1. Gold Bead Necklace"), "item 1");
assert(multi.includes("2. Silver Ring"), "item 2");
assert(multi.includes("Estimated Product Total:"), "total");
assert(multi.includes("Customer Name: Ada Lovelace"), "customer");
assert(multi.includes("Enquiry Reference: DEN-2026-000147"), "ref multi");

const special = buildWhatsAppUrl("447887539426", "Hello & welcome\nLine 2?");
assert(special.startsWith("https://wa.me/447887539426?text="), "wa.me format");
assert(special.includes(encodeURIComponent("Hello & welcome\nLine 2?")), "encoded");

const built = buildWhatsAppEnquiryUrl({
  phoneNumber: "+44 7887 539426",
  products: [product],
  customerDetails: { note: "Hi" },
  enquiryReference: "DEN-2026-000148",
  intendedAction: "ENQUIRY",
});
assert(built.whatsappUrl.includes("wa.me/447887539426"), "phone cleaned");
assert(built.message.includes("DEN-2026-000148"), "ref in message");
assert(built.estimatedTotal === 90, "total calc");

const positional = buildWhatsAppEnquiryUrl(
  "447887539426",
  [product],
  { name: "Test" },
  "DEN-2026-000149",
  "PAYMENT",
);
assert(positional.message.includes("Complete Payment"), "positional overload");

console.log("All WhatsApp enquiry builder tests passed.");
