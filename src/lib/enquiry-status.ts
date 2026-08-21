/**
 * Human-readable enquiry status copy for storefront track + admin triage.
 */

export const ENQUIRY_STATUSES = [
  "NEW",
  "WHATSAPP_OPENED",
  "CUSTOMER_CONTACTED",
  "AVAILABILITY_CONFIRMED",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type EnquiryStatusCode = (typeof ENQUIRY_STATUSES)[number];

const STATUS_COPY: Record<
  EnquiryStatusCode,
  { label: string; customerNext: string; adminHint: string }
> = {
  NEW: {
    label: "Received",
    customerNext: "We’ve received your enquiry. Denard will reply on WhatsApp soon.",
    adminHint: "Open WhatsApp and greet the customer",
  },
  WHATSAPP_OPENED: {
    label: "WhatsApp opened",
    customerNext: "Your WhatsApp message was prepared. Send it if you haven’t already, then wait for our reply.",
    adminHint: "Customer may have opened WhatsApp — check for their message",
  },
  CUSTOMER_CONTACTED: {
    label: "We’re in touch",
    customerNext: "A team member has contacted you on WhatsApp. Reply there to continue.",
    adminHint: "Conversation started — confirm availability next",
  },
  AVAILABILITY_CONFIRMED: {
    label: "Availability confirmed",
    customerNext: "We’ve confirmed availability. Next we’ll agree payment and delivery on WhatsApp.",
    adminHint: "Ready to send payment details or a Stripe link",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    customerNext: "Please complete payment using the instructions Denard sent on WhatsApp.",
    adminHint: "Follow up if payment isn’t received",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment confirmed",
    customerNext: "Thank you — payment is confirmed. We’ll prepare your order next.",
    adminHint: "Move to processing / packing",
  },
  PROCESSING: {
    label: "Being prepared",
    customerNext: "Your order is being prepared. We’ll update you when it’s on the way.",
    adminHint: "Pack and arrange dispatch",
  },
  DISPATCHED: {
    label: "On its way",
    customerNext: "Your order has been dispatched. Check WhatsApp for courier details.",
    adminHint: "Share tracking if available",
  },
  COMPLETED: {
    label: "Completed",
    customerNext: "This enquiry is complete. Thank you for shopping with Denard.",
    adminHint: "Done — archive if needed",
  },
  CANCELLED: {
    label: "Cancelled",
    customerNext: "This enquiry was cancelled. Message us on WhatsApp if you’d like to start again.",
    adminHint: "Closed — no further action",
  },
};

export function enquiryStatusLabel(status: string): string {
  const key = status as EnquiryStatusCode;
  return STATUS_COPY[key]?.label ?? status.replaceAll("_", " ");
}

export function enquiryStatusCustomerNext(status: string): string {
  const key = status as EnquiryStatusCode;
  return (
    STATUS_COPY[key]?.customerNext ??
    "Message Denard on WhatsApp with your enquiry reference for the latest update."
  );
}

export function enquiryStatusAdminHint(status: string): string {
  const key = status as EnquiryStatusCode;
  return STATUS_COPY[key]?.adminHint ?? "Review and update status";
}
