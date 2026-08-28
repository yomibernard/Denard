import { Suspense } from "react";
import EnquiryPageClient from "./enquiry-client";

export const metadata = {
  title: "Your bag",
  description: "Review your Denard selections, pay by card or enquire on WhatsApp.",
};

export default function EnquiryPage() {
  return (
    <Suspense
      fallback={
        <div className="container-denard py-16 text-center text-sm text-muted">Loading bag…</div>
      }
    >
      <EnquiryPageClient />
    </Suspense>
  );
}
