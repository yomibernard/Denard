"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { buttonClassName } from "@/components/ui/button";

const CONSENT_KEY = "denard_cookie_consent";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as Consent;
    if (stored === "accepted" || stored === "rejected") setConsent(stored);
    setReady(true);
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accepted = consent === "accepted";

  function choose(value: "accepted" | "rejected") {
    localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {ready && accepted && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted' });
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}

      {ready && accepted && pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}

      {ready && consent === null ? (
        <div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-0 bottom-0 z-[80] border-t border-line bg-surface/98 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:p-5"
        >
          <div className="container-denard flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-sm text-ink-soft">
              We use cookies to understand how Denard is used and to improve our service. Analytics
              load only after you accept. See our{" "}
              <a href="/privacy" className="text-accent underline underline-offset-2">
                Privacy policy
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClassName({ variant: "outline", size: "sm" })}
                onClick={() => choose("rejected")}
              >
                Reject
              </button>
              <button
                type="button"
                className={buttonClassName({ size: "sm" })}
                onClick={() => choose("accepted")}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
