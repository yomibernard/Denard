"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency?: string;
  brand?: { name: string } | null;
  images?: Array<{ url: string; alt?: string | null }>;
};

type SearchCategory = {
  id: string;
  name: string;
  slug: string;
};

type SearchResponse = {
  products?: SearchProduct[];
  categories?: SearchCategory[];
};

export type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({ products: [], categories: [] });

  const close = useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setResults({ products: [], categories: [] });
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const root = document.getElementById("denard-search-dialog");
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults({ products: [], categories: [] });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as SearchResponse;
        setResults({
          products: data.products ?? [],
          categories: data.categories ?? [],
        });
        const { trackEvent } = await import("@/lib/analytics");
        trackEvent({ eventName: "search", searchTerm: q });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults({ products: [], categories: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  if (!open) return null;

  const products = results.products ?? [];
  const categories = results.categories ?? [];
  const hasQuery = query.trim().length >= 2;
  const empty = hasQuery && !loading && products.length === 0 && categories.length === 0;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={inputId}>
      <button
        type="button"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        aria-label="Close search"
        onClick={close}
      />

      <div
        id="denard-search-dialog"
        className="relative mx-auto mt-[8vh] w-[min(100%-1.5rem,560px)] animate-fade-up overflow-hidden border border-line bg-surface shadow-[0_24px_60px_rgba(18,21,26,0.18)]"
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
          <Input
            ref={inputRef}
            id={inputId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands…"
            className="h-14 border-0 bg-transparent px-0 shadow-none focus:ring-0"
            aria-label="Search"
            autoComplete="off"
          />
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" /> : null}
          <button
            type="button"
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center text-muted hover:text-ink"
            aria-label="Close"
            onClick={close}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto">
          {!hasQuery ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Type at least 2 characters to search.
            </p>
          ) : null}

          {empty ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No matches for “{query.trim()}”.
            </p>
          ) : null}

          {categories.length > 0 ? (
            <div className="border-b border-line px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                Categories
              </p>
              <ul className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={close}
                      className="inline-flex border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {products.length > 0 ? (
            <ul className="divide-y divide-line">
              {products.map((p) => {
                const img = p.images?.[0];
                return (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas"
                    >
                      <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-sand">
                        {img ? (
                          <Image
                            src={img.url}
                            alt={img.alt || p.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        {p.brand?.name ? (
                          <p className="text-[10px] uppercase tracking-[0.08em] text-muted">
                            {p.brand.name}
                          </p>
                        ) : null}
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink-soft">
                          {formatPrice(p.price, p.currency ?? "GBP")}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {hasQuery && products.length > 0 ? (
            <div className="border-t border-line px-4 py-3">
              <Link
                href={`/shop?q=${encodeURIComponent(query.trim())}`}
                onClick={close}
                className="text-sm font-medium text-accent hover:underline"
              >
                View all results
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
