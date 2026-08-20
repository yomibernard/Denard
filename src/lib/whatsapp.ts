import { formatPrice } from "@/lib/utils";

export type IntendedActionType = "ENQUIRY" | "PAYMENT";

export type WhatsAppProductLine = {
  name: string;
  sku: string;
  colour?: string | null;
  size?: string | null;
  variant?: string | null;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number | null;
  currency?: string;
  url?: string | null;
  imageUrl?: string | null;
};

export type WhatsAppCustomerDetails = {
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  note?: string;
};

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function line(label: string, value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  return `${label}: ${value}`;
}

function formatDisplayPrice(amount: number, compareAt?: number | null, currency = "GBP") {
  const current = formatPrice(amount, currency);
  if (compareAt != null && compareAt > amount) {
    return `${current} (was ${formatPrice(compareAt, currency)})`;
  }
  return current;
}

function actionLabel(action: IntendedActionType) {
  return action === "PAYMENT" ? "Complete Payment" : "Make an Enquiry";
}

export function buildSingleProductMessage(opts: {
  product: WhatsAppProductLine;
  intendedAction: IntendedActionType;
  note?: string;
  reference?: string;
}) {
  const p = opts.product;
  const currency = p.currency ?? "GBP";
  const lines = [
    "Hello Denard,",
    "",
    "I am interested in the following product:",
    "",
    line("Product", p.name),
    line("Reference", p.sku),
    line("Colour", p.colour),
    line("Size", p.size),
    line("Variant", p.variant),
    line("Quantity", p.quantity),
    line("Displayed Price", formatDisplayPrice(p.unitPrice, p.compareAtPrice, currency)),
    line("Product Link", p.url),
    "",
    `I would like to: ${actionLabel(opts.intendedAction)}`,
    opts.reference ? line("Enquiry Reference", opts.reference) : null,
    "",
    "Customer Note:",
    opts.note?.trim() || "None",
    "",
    "Please confirm availability, delivery cost, final amount and payment details.",
    "",
    "Thank you.",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function buildMultiProductMessage(opts: {
  products: WhatsAppProductLine[];
  customer: WhatsAppCustomerDetails;
  intendedAction: IntendedActionType;
  reference: string;
  estimatedTotal: number;
  currency?: string;
}) {
  const currency = opts.currency ?? "GBP";
  const location = [opts.customer.city, opts.customer.country].filter(Boolean).join(", ");

  const itemBlocks = opts.products.map((p, i) => {
    return [
      `${i + 1}. ${p.name}`,
      line("Reference", p.sku),
      line("Colour", p.colour),
      line("Size", p.size),
      line("Variant", p.variant),
      line("Quantity", p.quantity),
      line("Unit Price", formatDisplayPrice(p.unitPrice, p.compareAtPrice, currency)),
      line("Product Link", p.url),
    ]
      .filter((l) => l !== null)
      .join("\n");
  });

  const lines = [
    "Hello Denard,",
    "",
    "I would like to enquire about or purchase the following products:",
    "",
    itemBlocks.join("\n\n"),
    "",
    `Estimated Product Total: ${formatPrice(opts.estimatedTotal, currency)}`,
    "",
    line("Customer Name", opts.customer.name),
    line("Telephone Number", opts.customer.phone),
    line("Delivery Location", location || undefined),
    `Preferred Action: ${actionLabel(opts.intendedAction)}`,
    `Enquiry Reference: ${opts.reference}`,
    "",
    "Customer Note:",
    opts.customer.note?.trim() || "None",
    "",
    "Please confirm product availability, delivery fee, final amount and payment details.",
    "",
    "Thank you.",
  ];

  return lines.filter((l) => l !== null).join("\n");
}

/**
 * Build a WhatsApp click-to-chat URL with a fully encoded message.
 * Phone must be digits only with country code (no +, spaces, or leading 0).
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string) {
  const phone = cleanPhone(phoneNumber);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Reusable enquiry → WhatsApp URL builder.
 * Prefer this for product journeys; use buildWhatsAppUrl(phone, message) for raw links.
 */
export function buildWhatsAppEnquiryUrl(
  phoneNumber: string,
  products: WhatsAppProductLine[],
  customerDetails: WhatsAppCustomerDetails | undefined,
  enquiryReference: string | undefined,
  intendedAction: IntendedActionType,
): { message: string; whatsappUrl: string; estimatedTotal: number };
export function buildWhatsAppEnquiryUrl(opts: {
  phoneNumber: string;
  products: WhatsAppProductLine[];
  customerDetails?: WhatsAppCustomerDetails;
  enquiryReference?: string;
  intendedAction: IntendedActionType;
}): { message: string; whatsappUrl: string; estimatedTotal: number };
export function buildWhatsAppEnquiryUrl(
  phoneOrOpts:
    | string
    | {
        phoneNumber: string;
        products: WhatsAppProductLine[];
        customerDetails?: WhatsAppCustomerDetails;
        enquiryReference?: string;
        intendedAction: IntendedActionType;
      },
  productsArg?: WhatsAppProductLine[],
  customerDetailsArg?: WhatsAppCustomerDetails,
  enquiryReferenceArg?: string,
  intendedActionArg?: IntendedActionType,
) {
  const opts =
    typeof phoneOrOpts === "string"
      ? {
          phoneNumber: phoneOrOpts,
          products: productsArg ?? [],
          customerDetails: customerDetailsArg,
          enquiryReference: enquiryReferenceArg,
          intendedAction: intendedActionArg ?? ("ENQUIRY" as IntendedActionType),
        }
      : phoneOrOpts;
  if (!opts.products.length) {
    throw new Error("At least one product is required");
  }

  const estimatedTotal = opts.products.reduce(
    (sum, p) => sum + p.unitPrice * p.quantity,
    0,
  );

  const message =
    opts.products.length === 1
      ? buildSingleProductMessage({
          product: opts.products[0],
          intendedAction: opts.intendedAction,
          note: opts.customerDetails?.note,
          reference: opts.enquiryReference,
        })
      : buildMultiProductMessage({
          products: opts.products,
          customer: opts.customerDetails ?? {},
          intendedAction: opts.intendedAction,
          reference: opts.enquiryReference ?? "PENDING",
          estimatedTotal,
          currency: opts.products[0]?.currency,
        });

  return {
    message,
    whatsappUrl: buildWhatsAppUrl(opts.phoneNumber, message),
    estimatedTotal,
  };
}

export function openWhatsApp(phone: string, message: string) {
  const url = buildWhatsAppUrl(phone, message);
  if (typeof window === "undefined") return url;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.assign(url);
  } else {
    const popup = window.open(url, "denard-whatsapp");
    if (!popup) {
      window.location.assign(url);
    }
  }
  return url;
}

export function generalAssistanceMessage() {
  return [
    "Hello Denard,",
    "",
    "I am browsing your website and would like assistance with your products.",
    "Please help me with availability, pricing and ordering.",
    "",
    "Thank you.",
  ].join("\n");
}
