"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppUrl, generalAssistanceMessage } from "@/lib/whatsapp";

export type WhatsAppFabProps = {
  phone: string;
  className?: string;
};

export function WhatsAppFab({ phone, className }: WhatsAppFabProps) {
  if (!phone) return null;

  const href = buildWhatsAppUrl(phone, generalAssistanceMessage());

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp with Denard"
      onClick={() => trackEvent({ eventName: "whatsapp_fab_click" })}
      className={cn(
        "fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center",
        "bg-whatsapp text-white ring-1 ring-ink/10",
        "transition-colors duration-200 hover:bg-whatsapp-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "sm:bottom-5 sm:right-5",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
    </a>
  );
}
