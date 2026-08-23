"use client";

import { useEffect, useState } from "react";

const KEY = "denard_pending_enquiry";

export function EnquiryOfflineRetry() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    setPending(true);
    if (!navigator.onLine) return;

    void (async () => {
      try {
        const body = JSON.parse(raw);
        const res = await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) localStorage.removeItem(KEY);
        setPending(false);
      } catch {
        setPending(true);
      }
    })();
  }, []);

  if (!pending) return null;
  return (
    <p className="mt-3 text-xs text-amber">
      You have an unsaved enquiry from a previous attempt. We’ll retry when you’re online.
    </p>
  );
}

export function savePendingEnquiry(payload: unknown) {
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export const persistFailedEnquiry = savePendingEnquiry;
export const EnquiryOfflineBanner = EnquiryOfflineRetry;
