"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-denard flex flex-col items-center justify-center py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">Error</p>
      <h1 className="mt-3 font-display text-3xl md:text-4xl text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        We could not load this page. Try again, or continue shopping while we sort it out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClassName()}>
          Try again
        </button>
        <Link href="/" className={buttonClassName({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </div>
  );
}
