"use client";

import Image from "next/image";
import { useCallback, useRef, useState, useTransition } from "react";
import { ImagePlus, Link2, Star, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export function ProductImageManager({
  productId,
  productName,
  initialImages,
}: {
  productId: string;
  productName: string;
  initialImages: AdminProductImage[];
}) {
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshFrom = useCallback((next: AdminProductImage[]) => {
    setImages(next);
  }, []);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setError(null);
    const form = new FormData();
    for (const file of list) form.append("files", file);

    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      // Reload full list
      const listRes = await fetch(`/api/admin/products/${productId}/images`);
      const listData = await listRes.json();
      if (listRes.ok) refreshFrom(listData.images ?? []);
    });
  }

  async function addByUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim(), alt: productName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not add image URL");
        return;
      }
      setUrlInput("");
      const listRes = await fetch(`/api/admin/products/${productId}/images`);
      const listData = await listRes.json();
      if (listRes.ok) refreshFrom(listData.images ?? []);
    });
  }

  async function setPrimary(imageId: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: imageId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not set main image");
        return;
      }
      refreshFrom(data.images ?? []);
    });
  }

  async function removeImage(imageId: string) {
    if (!confirm("Remove this image?")) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/products/${productId}/images?imageId=${encodeURIComponent(imageId)}`,
        { method: "DELETE" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not delete image");
        return;
      }
      refreshFrom(data.images ?? []);
    });
  }

  async function saveAlt(imageId: string, alt: string) {
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, alt }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) refreshFrom(data.images ?? []);
  }

  function move(imageId: string, direction: -1 | 1) {
    const index = images.findIndex((i) => i.id === imageId);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    setImages(next);
    startTransition(async () => {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) refreshFrom(data.images ?? next);
    });
  }

  return (
    <section className="max-w-3xl space-y-4 rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Product images</h2>
          <p className="mt-1 text-xs text-muted">
            Upload JPG, PNG or WebP (max 8MB each). The first / starred image is the main photo on
            the shop.
          </p>
        </div>
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
      </div>

      {error ? (
        <p className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded border border-dashed border-line bg-canvas/60 px-4 py-8 text-center transition",
          dragOver && "border-accent bg-accent-soft/40",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus className="h-8 w-8 text-muted" strokeWidth={1.5} />
        <p className="text-sm text-ink-soft">Drag and drop images here</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="mt-1 h-9 rounded bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <form onSubmit={addByUrl} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="image-url">
            Or add by URL
          </label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="image-url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://… or /images/products/…"
              className="h-9 w-full rounded border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending || !urlInput.trim()}
          className="h-9 shrink-0 rounded border border-line bg-white px-4 text-sm font-medium hover:bg-canvas disabled:opacity-60"
        >
          Add URL
        </button>
      </form>

      {images.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No images yet for this product.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {images.map((img, index) => (
            <li
              key={img.id}
              className={cn(
                "overflow-hidden rounded border border-line",
                img.isPrimary && "ring-2 ring-accent",
              )}
            >
              <div className="relative aspect-[3/4] bg-canvas">
                <Image
                  src={img.url}
                  alt={img.alt || productName}
                  fill
                  className="object-cover"
                  sizes="240px"
                  unoptimized={img.url.startsWith("http")}
                />
                {img.isPrimary ? (
                  <span className="absolute left-2 top-2 rounded bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Main
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <input
                  defaultValue={img.alt ?? ""}
                  placeholder="Alt text"
                  className="h-8 w-full rounded border border-line px-2 text-xs outline-none focus:border-accent"
                  onBlur={(e) => {
                    if (e.target.value !== (img.alt ?? "")) {
                      void saveAlt(img.id, e.target.value);
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {!img.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => setPrimary(img.id)}
                      className="inline-flex h-8 items-center gap-1 rounded border border-line px-2 text-xs hover:bg-canvas"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Set main
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(img.id, -1)}
                    className="h-8 rounded border border-line px-2 text-xs hover:bg-canvas disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === images.length - 1}
                    onClick={() => move(img.id, 1)}
                    className="h-8 rounded border border-line px-2 text-xs hover:bg-canvas disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="ml-auto inline-flex h-8 items-center gap-1 rounded border border-line px-2 text-xs text-danger hover:bg-danger/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
