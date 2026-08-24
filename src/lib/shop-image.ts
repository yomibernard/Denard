/** Next/Image options so photos stay sharp and SVGs are not re-encoded as JPEG. */
export function shopImageProps(src: string) {
  const remote = /^https?:\/\//i.test(src);
  const vector = /\.svg(\?|#|$)/i.test(src);
  return {
    unoptimized: remote || vector,
    quality: 90 as const,
  };
}
