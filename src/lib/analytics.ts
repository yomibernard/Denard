"use client";

type AnalyticsPayload = {
  eventName: string;
  path?: string;
  productId?: string;
  categoryId?: string;
  searchTerm?: string;
  meta?: Record<string, unknown>;
};

export function trackEvent(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  // Persist to Denard analytics
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      path: payload.path ?? window.location.pathname,
      sessionId: getSessionId(),
      deviceType: detectDevice(),
    }),
    keepalive: true,
  }).catch(() => undefined);

  // Google Analytics
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (ga && typeof window.gtag === "function") {
    window.gtag("event", payload.eventName, {
      page_path: payload.path,
      product_id: payload.productId,
      search_term: payload.searchTerm,
      ...payload.meta,
    });
  }

  // Meta Pixel
  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", payload.eventName, payload.meta ?? {});
  }
}

function getSessionId() {
  const key = "denard_sid";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function detectDevice() {
  const w = window.innerWidth;
  if (w < 768) return "MOBILE";
  if (w < 1024) return "TABLET";
  return "DESKTOP";
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
