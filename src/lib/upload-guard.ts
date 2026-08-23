const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;
const MAGIC = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function isAllowedImageMime(mime: string, filename = "") {
  if (ALLOWED.has(mime)) return true;
  return /\.(jpe?g|png|webp)$/i.test(filename);
}

export function maxUploadBytes() {
  return MAX_BYTES;
}

export function looksLikeImage(buffer: Buffer, declaredMime: string) {
  return MAGIC.some((m) => {
    if (m.mime === "image/webp") {
      return (
        buffer.length >= 12 &&
        m.bytes.every((b, i) => buffer[i] === b) &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    }
    return m.bytes.every((b, i) => buffer[i] === b) && declaredMime.startsWith(m.mime.split("/")[0]);
  });
}
