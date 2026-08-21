import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredUpload = {
  url: string;
  key: string;
  storage: "s3" | "local";
};

function s3Configured() {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      (process.env.S3_PUBLIC_BASE_URL || process.env.S3_ENDPOINT),
  );
}

function getS3Client() {
  const region = process.env.S3_REGION || "auto";
  const endpoint = process.env.S3_ENDPOINT || undefined;
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" || Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

function publicUrlForKey(key: string) {
  const base = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (base) return `${base}/${key}`;
  // Fallback path-style URL for MinIO-style endpoints
  const endpoint = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
  const bucket = process.env.S3_BUCKET!;
  return `${endpoint}/${bucket}/${key}`;
}

/**
 * Store a product image buffer. Uses S3-compatible storage when configured
 * (AWS S3, Cloudflare R2, MinIO); otherwise writes under public/uploads for local dev.
 */
export async function storeProductImage(opts: {
  productId: string;
  buffer: Buffer;
  contentType: string;
  extension: string;
}): Promise<StoredUpload> {
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${opts.extension}`;
  const key = `products/${opts.productId}/${filename}`;

  if (s3Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: opts.buffer,
        ContentType: opts.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { url: publicUrlForKey(key), key, storage: "s3" };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "products", opts.productId);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), opts.buffer);
  return {
    url: `/uploads/products/${opts.productId}/${filename}`,
    key,
    storage: "local",
  };
}

export async function deleteStoredUpload(url: string) {
  if (url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    try {
      await unlink(filePath);
    } catch {
      /* missing file ok */
    }
    return;
  }

  if (!s3Configured()) return;

  const base = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  let key: string | null = null;
  if (base && url.startsWith(`${base}/`)) {
    key = url.slice(base.length + 1);
  } else if (url.includes("/products/")) {
    const idx = url.indexOf("products/");
    key = url.slice(idx);
  }
  if (!key) return;

  try {
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      }),
    );
  } catch {
    /* best-effort delete */
  }
}

export function mediaStorageMode(): "s3" | "local" {
  return s3Configured() ? "s3" : "local";
}
