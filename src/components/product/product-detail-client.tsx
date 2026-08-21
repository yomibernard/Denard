"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Columns2, Heart, MessageCircle, Minus, Plus, Share2, ZoomIn, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import {
  WhatsAppEnquiryModal,
  type EnquiryCustomerFormValues,
  type WhatsAppEnquiryReady,
} from "@/components/enquiry/whatsapp-enquiry-modal";
import { trackEvent } from "@/lib/analytics";
import type { IntendedActionType } from "@/lib/whatsapp";
import {
  cancelWhatsAppLaunch,
  completeWhatsAppLaunch,
  type WhatsAppLaunchHandle,
} from "@/lib/whatsapp-launch";
import { absoluteUrl, cn, discountPercent, formatPrice } from "@/lib/utils";
import {
  useCompare,
  useEnquiryBasket,
  useRecentlyViewed,
  useWishlist,
} from "@/store/commerce";
import Link from "next/link";

export type PdpColour = { id: string; name: string; hex: string; slug: string };
export type PdpSize = { id: string; name: string; slug: string };
export type PdpVariant = {
  id: string;
  sku: string;
  name: string | null;
  price: number | null;
  compareAtPrice: number | null;
  availability: string;
  colour: PdpColour | null;
  size: PdpSize | null;
};
export type PdpImage = { id: string; url: string; alt: string | null };

export type ProductDetailClientProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    currency: string;
    shortDescription: string | null;
    description: string | null;
    careInstructions: string | null;
    sizeGuide: string | null;
    availability: string;
    isNew: boolean;
    isBestSeller: boolean;
    isOnOffer: boolean;
    isFeatured: boolean;
    brand: { name: string } | null;
    images: PdpImage[];
    variants: PdpVariant[];
  };
  whatsappPhone?: string;
};

type WaMode = "ENQUIRY" | "PAYMENT" | null;

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const colours = useMemo(() => {
    const map = new Map<string, PdpColour>();
    for (const v of product.variants) {
      if (v.colour) map.set(v.colour.id, v.colour);
    }
    return Array.from(map.values());
  }, [product.variants]);

  const sizes = useMemo(() => {
    const map = new Map<string, PdpSize>();
    for (const v of product.variants) {
      if (v.size) map.set(v.size.id, v.size);
    }
    return Array.from(map.values());
  }, [product.variants]);

  const styleOptions = useMemo(() => {
    const names = new Set<string>();
    for (const v of product.variants) {
      if (v.name?.trim()) names.add(v.name.trim());
    }
    return Array.from(names);
  }, [product.variants]);

  const requiresColour = colours.length > 0;
  const requiresSize = sizes.length > 0;
  const requiresStyle = styleOptions.length > 1;

  const [colourId, setColourId] = useState<string | null>(colours[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<string | null>(sizes.length === 1 ? sizes[0].id : null);
  const [styleName, setStyleName] = useState<string | null>(
    styleOptions.length === 1 ? styleOptions[0] : null,
  );
  const [qty, setQty] = useState(1);
  const [question, setQuestion] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [addedFlash, setAddedFlash] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [shareFlash, setShareFlash] = useState(false);
  const [waMode, setWaMode] = useState<WaMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [ready, setReady] = useState<WhatsAppEnquiryReady | null>(null);
  const submitLock = useRef(false);

  const addItem = useEnquiryBasket((s) => s.addItem);
  const toggleWish = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const toggleCompare = useCompare((s) => s.toggle);
  const comparing = useCompare((s) => s.ids.includes(product.id));
  const pushRecent = useRecentlyViewed((s) => s.push);

  useEffect(() => {
    pushRecent(product.id);
    trackEvent({ eventName: "product_view", productId: product.id });
  }, [product.id, pushRecent]);

  useEffect(() => {
    if (!zoomOpen && !sizeGuideOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setZoomOpen(false);
        setSizeGuideOpen(false);
        setZoomScale(1);
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoomOpen, sizeGuideOpen]);

  const availableSizesForColour = useMemo(() => {
    if (!requiresColour) return sizes;
    return sizes.filter((s) =>
      product.variants.some(
        (v) =>
          v.size?.id === s.id &&
          (!colourId || v.colour?.id === colourId) &&
          (!styleName || !v.name || v.name.trim() === styleName),
      ),
    );
  }, [product.variants, sizes, colourId, requiresColour, styleName]);

  useEffect(() => {
    const options = requiresColour ? availableSizesForColour : sizes;
    if (options.length === 1 && sizeId !== options[0].id) {
      setSizeId(options[0].id);
    } else if (sizeId && options.length > 0 && !options.some((s) => s.id === sizeId)) {
      setSizeId(options.length === 1 ? options[0].id : null);
    }
  }, [availableSizesForColour, sizes, requiresColour, sizeId]);

  const selectedVariant = useMemo(() => {
    if (!product.variants.length) return null;
    return (
      product.variants.find((v) => {
        const colourOk = !requiresColour || v.colour?.id === colourId;
        const sizeOk = !requiresSize || v.size?.id === sizeId;
        const styleOk = !requiresStyle || (v.name?.trim() ?? "") === (styleName ?? "");
        return colourOk && sizeOk && styleOk;
      }) ?? null
    );
  }, [product.variants, colourId, sizeId, styleName, requiresColour, requiresSize, requiresStyle]);

  const unitPrice = selectedVariant?.price ?? product.price;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const pct = discountPercent(unitPrice, compareAt);
  const sku = selectedVariant?.sku ?? product.sku;
  const colourName = colours.find((c) => c.id === colourId)?.name;
  const sizeName = sizes.find((s) => s.id === sizeId)?.name;
  const variantLabel = selectedVariant?.name?.trim() || styleName || undefined;
  const productUrl = absoluteUrl(`/product/${product.slug}`);
  const imageUrl = product.images[0]?.url
    ? product.images[0].url.startsWith("http")
      ? product.images[0].url
      : absoluteUrl(product.images[0].url)
    : undefined;
  const unavailable =
    product.availability === "OUT_OF_STOCK" ||
    selectedVariant?.availability === "OUT_OF_STOCK";

  function validateOptions() {
    if (unavailable) {
      setError("This product is currently unavailable.");
      return false;
    }
    if (requiresColour && !colourId) {
      setError("Please select a colour.");
      return false;
    }
    if (requiresSize && !sizeId) {
      setError("Please select a size.");
      return false;
    }
    if (requiresStyle && !styleName) {
      setError("Please select a style.");
      return false;
    }
    if ((requiresColour || requiresSize || requiresStyle) && !selectedVariant) {
      setError("That combination is unavailable.");
      return false;
    }
    setError(null);
    return true;
  }

  function addToEnquiry() {
    if (!validateOptions()) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      sku,
      slug: product.slug,
      imageUrl: product.images[0]?.url,
      colour: colourName,
      size: sizeName,
      variant: variantLabel,
      quantity: qty,
      unitPrice,
      compareAtPrice: compareAt,
      currency: product.currency,
    });
    trackEvent({
      eventName: "add_to_enquiry",
      productId: product.id,
      meta: { sku, qty, colour: colourName, size: sizeName, variant: variantLabel },
    });
    setAddedFlash(true);
    window.setTimeout(() => setAddedFlash(false), 2500);
  }

  function openWaFlow(action: IntendedActionType) {
    if (!validateOptions()) return;
    setModalError(null);
    setReady(null);
    setWaMode(action);
  }

  async function submitWhatsApp(
    values: EnquiryCustomerFormValues,
    prepared: WhatsAppLaunchHandle,
  ) {
    if (submitLock.current) {
      cancelWhatsAppLaunch(prepared);
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          note: values.note,
          intendedAction: values.intendedAction,
          pageSource: productUrl,
          source: "product_page",
          items: [
            {
              productId: product.id,
              variantId: selectedVariant?.id,
              productName: product.name,
              productSku: sku,
              colourName: colourName,
              sizeName: sizeName,
              variantLabel,
              quantity: qty,
              unitPrice,
              compareAtPrice: compareAt,
              productUrl: `/product/${product.slug}`,
              imageUrl,
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.whatsappUrl) {
        cancelWhatsAppLaunch(prepared);
        setModalError(data.error ?? "Could not prepare your enquiry. Please try again.");
        return;
      }

      const confirmationText =
        data.confirmation ??
        `Your enquiry ${data.reference} has been prepared. WhatsApp is opening so you can send it to Denard.`;
      setConfirmation(confirmationText);
      trackEvent({
        eventName: "enquiry_submit",
        productId: product.id,
        meta: { reference: data.reference, action: values.intendedAction },
      });

      const { opened } = completeWhatsAppLaunch(data.whatsappUrl, prepared);
      if (opened) {
        setWaMode(null);
        setReady(null);
      } else {
        // Popup blocked — keep modal open with a direct WhatsApp link.
        setReady({
          reference: data.reference,
          whatsappUrl: data.whatsappUrl,
          confirmation: confirmationText,
        });
      }
    } catch {
      cancelWhatsAppLaunch(prepared);
      setModalError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  }

  const images = product.images.length
    ? product.images
    : [{ id: "placeholder", url: "/images/hero.svg", alt: product.name }];

  async function shareProduct() {
    const url = productUrl;
    const payload = { title: product.name, text: product.shortDescription ?? product.name, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
      } else {
        await navigator.clipboard.writeText(url);
        setShareFlash(true);
        window.setTimeout(() => setShareFlash(false), 2000);
      }
      trackEvent({ eventName: "product_share", productId: product.id });
    } catch {
      /* user cancelled share */
    }
  }

  const actionButtons = (
    <>
      <Button type="button" onClick={addToEnquiry} className="min-w-[10rem] min-h-12">
        Add to Enquiry Bag
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-12"
        onClick={() => openWaFlow("ENQUIRY")}
      >
        <MessageCircle className="h-4 w-4" />
        Enquire on WhatsApp
      </Button>
      <Button
        type="button"
        variant="whatsapp"
        className="min-h-12"
        onClick={() => openWaFlow("PAYMENT")}
      >
        <MessageCircle className="h-4 w-4" />
        Buy via WhatsApp
      </Button>
    </>
  );

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-10 xl:gap-14">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          <button
            type="button"
            className="absolute inset-0 z-0"
            onClick={() => setZoomOpen(true)}
            aria-label="Zoom product image"
          >
            <Image
              src={images[activeImage]?.url ?? images[0].url}
              alt={images[activeImage]?.alt || product.name}
              fill
              priority
              unoptimized={(images[activeImage]?.url ?? images[0].url).startsWith("http")}
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </button>
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center bg-surface/90 text-ink-soft">
            <ZoomIn className="h-4 w-4" strokeWidth={1.6} />
          </span>
        </div>
        {images.length > 1 ? (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-16 w-14 overflow-hidden border-2",
                    i === activeImage ? "border-accent" : "border-transparent",
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} view ${i + 1}`}
                    fill
                    unoptimized={img.url.startsWith("http")}
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {zoomOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4"
          role="dialog"
          aria-modal
          aria-label="Zoomed product image"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close zoom"
            onClick={() => {
              setZoomOpen(false);
              setZoomScale(1);
            }}
          />
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center bg-surface text-ink"
              aria-label="Zoom out"
              onClick={() => setZoomScale((s) => Math.max(1, Number((s - 0.25).toFixed(2))))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center bg-surface text-ink"
              aria-label="Zoom in"
              onClick={() => setZoomScale((s) => Math.min(3, Number((s + 0.25).toFixed(2))))}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center bg-surface text-ink"
              aria-label="Close"
              onClick={() => {
                setZoomOpen(false);
                setZoomScale(1);
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative z-10 h-[min(90vh,900px)] w-full max-w-3xl overflow-auto">
            <div
              className="relative mx-auto h-full w-full origin-center transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <Image
                src={images[activeImage]?.url ?? images[0].url}
                alt={images[activeImage]?.alt || product.name}
                fill
                unoptimized={(images[activeImage]?.url ?? images[0].url).startsWith("http")}
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      ) : null}

      {sizeGuideOpen && product.sizeGuide ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-label="Size guide"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close size guide"
            onClick={() => setSizeGuideOpen(false)}
          />
          <div className="relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl text-ink">Size guide</h2>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center text-ink-soft"
                aria-label="Close"
                onClick={() => setSizeGuideOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
              {product.sizeGuide}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 lg:mt-0">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.isNew ? <Badge variant="new">New</Badge> : null}
          {product.isOnOffer || pct ? <Badge variant="sale">Sale</Badge> : null}
          {product.isBestSeller ? <Badge variant="bestseller">Best seller</Badge> : null}
          {product.isFeatured ? <Badge variant="featured">Featured</Badge> : null}
        </div>

        {product.brand?.name ? (
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
            {product.brand.name}
          </p>
        ) : null}

        <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">{product.name}</h1>

        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-semibold text-ink">
            {formatPrice(unitPrice, product.currency)}
          </span>
          {compareAt && compareAt > unitPrice ? (
            <span className="text-base text-muted line-through">
              {formatPrice(compareAt, product.currency)}
            </span>
          ) : null}
          {pct ? <span className="text-sm font-semibold text-amber">-{pct}%</span> : null}
        </div>

        <p className="mt-1 text-xs text-muted">Reference: {sku}</p>

        {product.shortDescription ? (
          <p className="mt-4 text-ink-soft">{product.shortDescription}</p>
        ) : null}

        {requiresColour ? (
          <div className="mt-6">
            <Label className="mb-2">Colour{colourName ? `: ${colourName}` : ""}</Label>
            <div className="flex flex-wrap gap-2">
              {colours.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  onClick={() => {
                    setColourId(c.id);
                    setError(null);
                  }}
                  className={cn(
                    "h-11 w-11 rounded-full border-2",
                    colourId === c.id ? "border-accent ring-2 ring-accent/30" : "border-ink/15",
                  )}
                  style={{ backgroundColor: c.hex }}
                  aria-pressed={colourId === c.id}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
        ) : null}

        {requiresSize ? (
          <div className="mt-5">
            <Label className="mb-2">Size</Label>
            <div className="flex flex-wrap gap-2">
              {(requiresColour ? availableSizesForColour : sizes).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSizeId(s.id);
                    setError(null);
                  }}
                  className={cn(
                    "h-11 min-w-11 px-3 border text-sm",
                    sizeId === s.id
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-ink hover:border-accent",
                  )}
                  aria-pressed={sizeId === s.id}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {requiresStyle ? (
          <div className="mt-5">
            <Label className="mb-2">Style</Label>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => {
                    setStyleName(style);
                    setError(null);
                  }}
                  className={cn(
                    "h-11 min-w-11 px-3 border text-sm",
                    styleName === style
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-surface text-ink hover:border-accent",
                  )}
                  aria-pressed={styleName === style}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <Label className="mb-2">Quantity</Label>
          <div className="inline-flex items-center border border-line">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center text-ink-soft hover:bg-sand"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium tabular-nums">{qty}</span>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center text-ink-soft hover:bg-sand"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {addedFlash ? (
          <p className="mt-3 text-sm text-success">
            Added to enquiry bag.{" "}
            <Link href="/enquiry" className="underline underline-offset-2">
              View bag
            </Link>
          </p>
        ) : null}
        {confirmation ? (
          <p className="mt-3 rounded-[var(--denard-radius)] border border-mint/40 bg-mint/10 px-3 py-2 text-sm text-ink">
            {confirmation}
          </p>
        ) : null}

        <div className="mt-6 hidden gap-3 sm:flex sm:flex-wrap">{actionButtons}</div>

        <div className="mt-3 hidden flex-wrap gap-3 sm:flex">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              toggleWish(product.id);
              trackEvent({
                eventName: wished ? "wishlist_remove" : "wishlist_add",
                productId: product.id,
              });
            }}
            aria-pressed={wished}
          >
            <Heart className={cn("h-4 w-4", wished && "fill-current text-accent")} />
            {wished ? "Saved" : "Wishlist"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => toggleCompare(product.id)}
            aria-pressed={comparing}
          >
            <Columns2 className="h-4 w-4" />
            {comparing ? "Comparing" : "Compare"}
          </Button>
          <Button type="button" variant="ghost" onClick={shareProduct}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button type="button" variant="ghost" onClick={() => setAskOpen((o) => !o)}>
            Ask a question
          </Button>
        </div>
        {shareFlash ? (
          <p className="mt-2 text-sm text-success">Link copied to clipboard.</p>
        ) : null}

        {askOpen ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="pdp-question">Your question</Label>
            <Textarea
              id="pdp-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about availability, sizing, delivery…"
            />
            <Button
              type="button"
              variant="whatsapp"
              size="sm"
              disabled={!question.trim()}
              onClick={() => {
                if (!validateOptions() || !question.trim()) return;
                setWaMode("ENQUIRY");
              }}
            >
              Continue to WhatsApp
            </Button>
          </div>
        ) : null}

        {product.description ? (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="font-display text-xl text-ink">Details</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{product.description}</div>
          </div>
        ) : null}

        {product.careInstructions ? (
          <div className="mt-6">
            <h2 className="font-display text-lg text-ink">Care</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{product.careInstructions}</p>
          </div>
        ) : null}

        {product.sizeGuide ? (
          <div className="mt-6">
            <button
              type="button"
              className="flex w-full items-center justify-between border-b border-line py-3 text-left"
              onClick={() => setSizeGuideOpen(true)}
            >
              <h2 className="font-display text-lg text-ink">Size guide</h2>
              <span className="text-sm text-accent">Open</span>
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="font-display text-lg text-ink">Fit & sizing</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Many jewellery pieces are one size. For apparel, ask on WhatsApp with your usual UK
              size and we will confirm fit before you pay.
            </p>
          </div>
        )}
      </div>

      {/* Sticky mobile actions — leave room for FAB (bottom-20) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addToEnquiry}
            className={buttonClassName({ variant: "secondary", className: "min-h-12 flex-1 text-xs" })}
          >
            Enquiry Bag
          </button>
          <button
            type="button"
            onClick={() => openWaFlow("ENQUIRY")}
            className={buttonClassName({ variant: "outline", className: "min-h-12 flex-1 text-xs" })}
          >
            Enquire
          </button>
          <button
            type="button"
            onClick={() => openWaFlow("PAYMENT")}
            className={buttonClassName({ variant: "whatsapp", className: "min-h-12 flex-1 text-xs" })}
          >
            Buy
          </button>
        </div>
      </div>

      <WhatsAppEnquiryModal
        open={waMode !== null}
        onClose={() => {
          if (submitting) return;
          setWaMode(null);
          setReady(null);
          setModalError(null);
        }}
        title={waMode === "PAYMENT" ? "Buy via WhatsApp" : "Enquire on WhatsApp"}
        description="Share your details so we can save your enquiry and open WhatsApp with your product message ready to send."
        defaultAction={waMode ?? "ENQUIRY"}
        submitting={submitting}
        error={modalError}
        ready={ready}
        onSubmit={async (values, launch) => {
          const note =
            askOpen && question.trim()
              ? [values.note, `Question: ${question.trim()}`].filter(Boolean).join("\n\n")
              : values.note;
          await submitWhatsApp({ ...values, note }, launch);
        }}
      />
    </div>
  );
}
