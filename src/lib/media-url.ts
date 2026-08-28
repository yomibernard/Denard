/**
 * Public media URL helpers.
 * R2 public hosts often need the bucket name in the path when
 * S3_PUBLIC_BASE_URL was set to the bare pub-*.r2.dev origin.
 */

const R2_PUB = /^https:\/\/(pub-[a-z0-9]+)\.r2\.dev\/(?:([^/]+)\/)?(products\/.+)$/i;

export function mediaBucketName() {
  return (process.env.S3_BUCKET || "denard-media").replace(/^\/+|\/+$/g, "");
}

/** Ensure product image URLs point at the real R2 object path. */
export function normalizePublicMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  const match = trimmed.match(R2_PUB);
  if (!match) return trimmed;

  const host = match[1];
  const maybeBucket = match[2];
  const objectPath = match[3];
  const bucket = mediaBucketName();

  if (maybeBucket === bucket) {
    return `https://${host}.r2.dev/${bucket}/${objectPath}`;
  }
  if (!maybeBucket) {
    return `https://${host}.r2.dev/${bucket}/${objectPath}`;
  }
  // Unknown prefix — leave as-is
  return trimmed;
}

/** Build public URL for an object key (e.g. products/{id}/file.png). */
export function publicUrlForObjectKey(key: string) {
  const cleanKey = key.replace(/^\//, "");
  let base = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const bucket = mediaBucketName();

  if (base) {
    try {
      const host = new URL(base).hostname;
      if (/\.r2\.dev$/i.test(host) && !base.endsWith(`/${bucket}`)) {
        base = `${base}/${bucket}`;
      }
    } catch {
      /* keep base */
    }
    return `${base}/${cleanKey}`;
  }

  const endpoint = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
  if (endpoint && bucket) return `${endpoint}/${bucket}/${cleanKey}`;
  return `/${cleanKey}`;
}
