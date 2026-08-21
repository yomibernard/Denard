"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ClipboardList,
  Heart,
  Menu,
  MessageCircle,
  Search,
  X,
  ChevronDown,
  Columns2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl, generalAssistanceMessage } from "@/lib/whatsapp";
import { useCompare, useEnquiryBasket, useWishlist } from "@/store/commerce";
import { buttonClassName } from "@/components/ui/button";
import { SearchDialog } from "@/components/search/search-dialog";
import { DenardLogo } from "@/components/brand/denard-logo";

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children?: Array<{ id: string; name: string; slug: string }>;
};

export type NavDepartment = {
  id: string;
  name: string;
  slug: string;
  categories?: NavCategory[];
};

export type HeaderProps = {
  departments?: NavDepartment[];
  whatsappPhone?: string;
  className?: string;
};

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?isNew=1", label: "New" },
  { href: "/shop?isBestSeller=1", label: "Best Sellers" },
  { href: "/shop?isOnOffer=1", label: "Offers" },
  { href: "/how-to-order", label: "How to order" },
  { href: "/track", label: "Track" },
] as const;

const HELP_LINKS = [
  { href: "/how-to-order", label: "How to order" },
  { href: "/track", label: "Track enquiry" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/faq", label: "FAQ" },
] as const;

export function Header({ departments = [], whatsappPhone = "", className }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [mobileDept, setMobileDept] = useState<string | null>(null);
  const deptWrapRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const deptMenuId = useId();

  const basketCount = useEnquiryBasket((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const wishlistCount = useWishlist((s) => s.ids.length);
  const compareCount = useCompare((s) => s.ids.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    mobileCloseRef.current?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    if (!deptOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeptOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deptOpen]);

  const waHref = whatsappPhone
    ? buildWhatsAppUrl(whatsappPhone, generalAssistanceMessage())
    : "#";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-transparent bg-ivory/95 backdrop-blur-md transition-all duration-300",
          scrolled && "border-line shadow-soft",
          className,
        )}
      >
        <div className="container-denard relative flex h-[var(--header-h)] items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="focus-ring -ml-1 flex h-10 w-10 shrink-0 items-center justify-center text-ink lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:left-auto lg:top-auto lg:translate-x-0 lg:translate-y-0">
            <DenardLogo variant="wordmark" priority className="shrink-0" />
          </div>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link-premium px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}

            {departments.length > 0 ? (
              <div
                ref={deptWrapRef}
                className="relative"
                onMouseEnter={() => setDeptOpen(true)}
                onMouseLeave={() => setDeptOpen(false)}
                onBlur={(e) => {
                  if (!deptWrapRef.current?.contains(e.relatedTarget as Node)) {
                    setDeptOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  className="nav-link-premium inline-flex items-center gap-1 px-3 py-2 text-sm text-ink-soft transition-colors hover:text-ink"
                  aria-expanded={deptOpen}
                  aria-controls={deptMenuId}
                  id="departments-trigger"
                  onClick={() => setDeptOpen((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setDeptOpen(true);
                    }
                  }}
                >
                  Departments
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", deptOpen && "rotate-180")}
                    strokeWidth={1.75}
                  />
                </button>

                <div
                  id={deptMenuId}
                  role="menu"
                  aria-labelledby="departments-trigger"
                  className={cn(
                    "absolute left-0 top-full pt-2 transition-all duration-200",
                    deptOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-1 opacity-0 pointer-events-none",
                  )}
                >
                  <div className="min-w-[520px] border border-line border-t-gold bg-surface p-6 border-t">
                    <div className="grid grid-cols-2 gap-6">
                      {departments.map((dept) => (
                        <div key={dept.id}>
                          <Link
                            href={`/department/${dept.slug}`}
                            role="menuitem"
                            className="font-display text-lg text-ink hover:text-mint-deep"
                            onClick={() => setDeptOpen(false)}
                          >
                            {dept.name}
                          </Link>
                          {dept.categories && dept.categories.length > 0 ? (
                            <ul className="mt-2 space-y-1.5">
                              {dept.categories.map((cat) => (
                                <li key={cat.id}>
                                  <Link
                                    href={`/category/${cat.slug}`}
                                    role="menuitem"
                                    className="text-sm text-ink-soft transition-colors hover:text-accent"
                                    onClick={() => setDeptOpen(false)}
                                  >
                                    {cat.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <button
              type="button"
              className="focus-ring flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-accent"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonClassName({ variant: "whatsapp", size: "sm" }),
                "hidden md:inline-flex",
              )}
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              WhatsApp
            </a>

            <Link
              href="/wishlist"
              className="focus-ring relative flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-accent"
              aria-label={`Wishlist, ${wishlistCount} items`}
            >
              <Heart className="h-5 w-5" strokeWidth={1.75} />
              {wishlistCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/compare"
              className="focus-ring relative hidden h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-accent sm:flex"
              aria-label={`Compare, ${compareCount} items`}
            >
              <Columns2 className="h-5 w-5" strokeWidth={1.75} />
              {compareCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {compareCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/enquiry"
              className="focus-ring relative flex h-10 w-10 items-center justify-center text-ink-soft transition-colors hover:text-accent"
              aria-label={`Enquiry list, ${basketCount} items`}
              title="Enquiry list"
            >
              <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
              {basketCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {basketCount > 99 ? "99+" : basketCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-ink/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(100%,320px)] flex-col bg-canvas shadow-xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-4">
            <DenardLogo variant="wordmark" href={null} className="!h-10 sm:!h-11" />
            <button
              ref={mobileCloseRef}
              type="button"
              className="focus-ring flex h-10 w-10 items-center justify-center text-ink"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2.5 text-base text-ink"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                Help
              </p>
              <ul className="space-y-1">
                {HELP_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-2 text-sm text-ink-soft"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {departments.length > 0 ? (
              <div className="mt-6 border-t border-line pt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Departments
                </p>
                <ul className="space-y-1">
                  {departments.map((dept) => {
                    const open = mobileDept === dept.id;
                    return (
                      <li key={dept.id}>
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/department/${dept.slug}`}
                            className="flex-1 py-2.5 text-base text-ink"
                            onClick={() => setMobileOpen(false)}
                          >
                            {dept.name}
                          </Link>
                          {dept.categories && dept.categories.length > 0 ? (
                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center text-muted"
                              aria-expanded={open}
                              aria-label={`${open ? "Collapse" : "Expand"} ${dept.name}`}
                              onClick={() => setMobileDept(open ? null : dept.id)}
                            >
                              <ChevronDown
                                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                              />
                            </button>
                          ) : null}
                        </div>
                        {open && dept.categories ? (
                          <ul className="mb-2 ml-3 space-y-1 border-l border-line pl-3">
                            {dept.categories.map((cat) => (
                              <li key={cat.id}>
                                <Link
                                  href={`/category/${cat.slug}`}
                                  className="block py-1.5 text-sm text-ink-soft"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {cat.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({
                variant: "whatsapp",
                size: "md",
                className: "mt-8 w-full",
              })}
              onClick={() => setMobileOpen(false)}
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
          </nav>
        </aside>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
