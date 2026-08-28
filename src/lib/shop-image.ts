/** Next/Image options so photos stay sharp and SVGs are not re-encoded as JPEG. */
import { normalizePublicMediaUrl } from "@/lib/media-url";

export function resolveShopImageSrc(src: string) {
  return normalizePublicMediaUrl(src);
}

export function shopImageProps(src: string) {
  const resolved = resolveShopImageSrc(src);
  const remote = /^https?:\/\//i.test(resolved);
  const vector = /\.svg(\?|#|$)/i.test(resolved);
  return {
    unoptimized: remote || vector,
    quality: 90 as const,
  };
}
