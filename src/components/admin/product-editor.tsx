"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import {
  ProductImageManager,
  type AdminProductImage,
} from "@/components/admin/product-image-manager";
import { ProductPreview } from "@/components/admin/product-preview";
import { WaitlistNotifyButton } from "@/components/admin/waitlist-notify-button";
import { productReadyToPublish } from "@/lib/product-publish";

type Option = { id: string; name: string };

type Props = {
  mode: "create" | "edit";
  productId?: string;
  productName: string;
  productSlug: string;
  initialStatus: string;
  initialImages: AdminProductImage[];
  waitlistPending?: number;
  siteUrl?: string;
  formInitial: ProductFormValues;
  departments: Option[];
  brands: Option[];
  categories: Option[];
  collections: Option[];
};

export function ProductEditor({
  mode,
  productId: initialProductId,
  productName: initialProductName,
  productSlug: initialProductSlug,
  initialStatus,
  initialImages,
  waitlistPending = 0,
  siteUrl,
  formInitial,
  departments,
  brands,
  categories,
  collections,
}: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(initialProductId);
  const [productName, setProductName] = useState(initialProductName);
  const [productSlug, setProductSlug] = useState(initialProductSlug);
  const [status, setStatus] = useState(initialStatus);
  const [images, setImages] = useState(initialImages);
  const [formSnapshot, setFormSnapshot] = useState(formInitial);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  const primaryImage = images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null;

  const preview = useMemo(
    () => ({
      name: formSnapshot.name,
      slug: productSlug || formSnapshot.slug,
      sku: formSnapshot.sku,
      price: formSnapshot.price,
      compareAtPrice: formSnapshot.compareAtPrice,
      shortDescription: formSnapshot.shortDescription,
      status,
      availability: formSnapshot.availability,
      imageUrl: primaryImage,
      imageCount: images.length,
    }),
    [formSnapshot, productSlug, status, primaryImage, images.length],
  );

  function onProductCreated(id: string, name: string, slug: string, nextStatus: string) {
    setProductId(id);
    setProductName(name);
    setProductSlug(slug);
    setStatus(nextStatus);
    router.replace(`/admin/products/${id}`);
  }

  function onStatusChange(next: string) {
    setStatus(next);
    if (next === "PUBLISHED") {
      setPublishNotice("Live on the shop — customers can see and enquire about this product now.");
    }
  }

  function onImagesChange(next: AdminProductImage[], autoPublished?: boolean) {
    setImages(next);
    if (autoPublished) {
      setStatus("PUBLISHED");
      setPublishNotice("Photo uploaded — product is now live on the shop.");
      router.refresh();
    }
  }

  const showImages = Boolean(productId);
  const ready = productReadyToPublish({
    name: formSnapshot.name,
    sku: formSnapshot.sku,
    price: Number(formSnapshot.price),
    imageCount: images.length,
  });

  return (
    <div className="space-y-5">
      {publishNotice ? (
        <p className="rounded border border-accent/30 bg-mint-soft/50 px-4 py-3 text-sm text-ink">
          {publishNotice}
        </p>
      ) : null}

      {mode === "create" && !productId ? (
        <div className="rounded-lg border border-line bg-sand/40 px-4 py-3 text-sm text-ink-soft">
          <strong className="text-ink">Step 1 of 2:</strong> Save product details below. Step 2: upload
          photos — the shop publishes automatically when details and at least one photo are ready.
        </div>
      ) : !ready && status !== "PUBLISHED" ? (
        <div className="rounded-lg border border-line bg-sand/40 px-4 py-3 text-sm text-ink-soft">
          {images.length < 1
            ? "Upload at least one product photo. When name, SKU, price and photo are all set, the product goes live automatically."
            : "Complete name, SKU and price, then save — the product will publish when ready."}
        </div>
      ) : null}

      {showImages ? (
        <>
          <ProductPreview product={preview} siteUrl={siteUrl} />
          <ProductImageManager
            productId={productId!}
            productName={productName}
            initialImages={images}
            isPublished={status === "PUBLISHED"}
            onImagesChange={onImagesChange}
            autoPublishWhenReady
          />
          {waitlistPending > 0 ? (
            <WaitlistNotifyButton productId={productId!} pendingCount={waitlistPending} />
          ) : null}
        </>
      ) : null}

      <ProductForm
        initial={formInitial}
        departments={departments}
        brands={brands}
        categories={categories}
        collections={collections}
        imageCount={images.length}
        liveStatus={status}
        onValuesChange={setFormSnapshot}
        onProductCreated={onProductCreated}
        onStatusChange={onStatusChange}
        hidePreview={showImages}
      />
    </div>
  );
}
