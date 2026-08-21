import path from "node:path";
import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { deleteStoredUpload, storeProductImage } from "@/lib/media";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function extFor(mime: string, filename: string) {
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  const fromName = path.extname(filename).toLowerCase();
  return fromName || ".jpg";
}

export async function GET(_request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return jsonError("Product not found", 404);

  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return jsonOk({ images });
}

export async function POST(request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id: productId } = await ctx.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return jsonError("Product not found", 404);

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const url = String(body.url ?? "").trim();
      if (!url) return jsonError("Image URL is required");
      if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
        return jsonError("URL must be absolute (https://…) or site path (/images/…)");
      }

      const count = await prisma.productImage.count({ where: { productId } });
      const image = await prisma.productImage.create({
        data: {
          productId,
          url,
          alt: body.alt ? String(body.alt) : product.name,
          sortOrder: count,
          isPrimary: count === 0,
        },
      });
      return jsonOk({ image }, { status: 201 });
    }

    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    const single = form.get("file");
    if (single instanceof File && single.size > 0) files.push(single);

    if (!files.length) return jsonError("No image files provided");

    let count = await prisma.productImage.count({ where: { productId } });
    const created = [];

    for (const file of files) {
      if (!ALLOWED.has(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
        return jsonError(`Unsupported file type: ${file.name || file.type}`);
      }
      if (file.size > MAX_BYTES) {
        return jsonError(`File too large (max 8MB): ${file.name}`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await storeProductImage({
        productId,
        buffer,
        contentType: file.type || "image/jpeg",
        extension: extFor(file.type, file.name),
      });

      const image = await prisma.productImage.create({
        data: {
          productId,
          url: stored.url,
          alt: product.name,
          sortOrder: count,
          isPrimary: count === 0,
        },
      });
      created.push(image);
      count += 1;
    }

    return jsonOk({ images: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id: productId } = await ctx.params;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return jsonError("Product not found", 404);

  try {
    const body = await request.json();

    if (Array.isArray(body.orderedIds)) {
      const ids = body.orderedIds.map(String);
      await prisma.$transaction(
        ids.map((imageId: string, index: number) =>
          prisma.productImage.updateMany({
            where: { id: imageId, productId },
            data: { sortOrder: index },
          }),
        ),
      );
      const images = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
      });
      return jsonOk({ images });
    }

    if (body.primaryId) {
      const primaryId = String(body.primaryId);
      const target = await prisma.productImage.findFirst({
        where: { id: primaryId, productId },
      });
      if (!target) return jsonError("Image not found", 404);

      await prisma.$transaction([
        prisma.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        }),
        prisma.productImage.update({
          where: { id: primaryId },
          data: { isPrimary: true, sortOrder: 0 },
        }),
      ]);

      const rest = await prisma.productImage.findMany({
        where: { productId, id: { not: primaryId } },
        orderBy: { sortOrder: "asc" },
      });
      await prisma.$transaction(
        rest.map((img, i) =>
          prisma.productImage.update({ where: { id: img.id }, data: { sortOrder: i + 1 } }),
        ),
      );

      const images = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
      });
      return jsonOk({ images });
    }

    if (body.imageId && body.alt !== undefined) {
      const image = await prisma.productImage.updateMany({
        where: { id: String(body.imageId), productId },
        data: { alt: String(body.alt) },
      });
      if (!image.count) return jsonError("Image not found", 404);
      const images = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: "asc" },
      });
      return jsonOk({ images });
    }

    return jsonError("Nothing to update");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { id: productId } = await ctx.params;
  const url = new URL(request.url);
  const imageId = url.searchParams.get("imageId");
  if (!imageId) return jsonError("imageId is required");

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) return jsonError("Image not found", 404);

  await prisma.productImage.delete({ where: { id: image.id } });
  await deleteStoredUpload(image.url);

  const remaining = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  if (remaining.length && !remaining.some((i) => i.isPrimary)) {
    await prisma.productImage.update({
      where: { id: remaining[0].id },
      data: { isPrimary: true },
    });
  }

  return jsonOk({
    images: await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    }),
  });
}
