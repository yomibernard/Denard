import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-denard flex flex-col items-center justify-center py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">404</p>
      <h1 className="mt-3 font-display text-3xl md:text-4xl text-ink">Page not found</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        That page is not in the Denard catalogue. Try the shop or head back home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClassName()}>
          Home
        </Link>
        <Link href="/shop" className={buttonClassName({ variant: "outline" })}>
          Shop all
        </Link>
      </div>
    </div>
  );
}
