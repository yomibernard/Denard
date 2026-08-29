import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";
import StylePageClient from "./style-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Your Denard Edit",
  description:
    "Tell Denard your taste — metals, vibe and occasions — and get a personal fashion edit. Discover. Curate. Connect.",
  path: "/style",
});

export default function StylePage() {
  return (
    <Suspense
      fallback={
        <div className="container-denard py-16 text-center text-sm text-muted">
          Loading style profile…
        </div>
      }
    >
      <StylePageClient />
    </Suspense>
  );
}
