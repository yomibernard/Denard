import { createHash } from "node:crypto";

export function enquiryFingerprint(input: {
  customerPhone: string;
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>;
}) {
  const phone = input.customerPhone.replace(/\D/g, "");
  const lines = [...input.items]
    .map((i) => `${i.productId}:${i.variantId ?? ""}:${i.quantity}`)
    .sort()
    .join("|");
  return createHash("sha256").update(`${phone}|${lines}`).digest("hex").slice(0, 40);
}

export function clientIdempotencyKey(request: Request, fingerprint: string) {
  const header = request.headers.get("idempotency-key")?.trim();
  if (header && header.length >= 8 && header.length <= 80) return header;
  return fingerprint;
}
