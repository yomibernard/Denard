import "server-only";
import { prisma } from "@/lib/db";

const DEFAULT_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
  process.env.WHATSAPP_PHONE ??
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE ??
  "447887539426";

/** Resolve WhatsApp business number from settings or env (digits only, country code, no +). */
export async function getWhatsAppPhone(): Promise<string> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "whatsapp_phone" } });
    if (setting?.value) return setting.value.replace(/\D/g, "");
  } catch {
    // DB may be unavailable during build
  }
  return DEFAULT_PHONE.replace(/\D/g, "");
}
