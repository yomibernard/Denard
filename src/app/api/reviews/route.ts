import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const limit = 5;
  const rl = rateLimit({
    key: `review:${clientIp(request)}`,
    limit,
    windowMs: 60 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many review submissions. Try again later." },
      { status: 429, headers: rateLimitHeaders(rl, limit) },
    );
  }

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        authorName: parsed.data.authorName.trim(),
        rating: parsed.data.rating,
        title: parsed.data.title?.trim() || null,
        body: parsed.data.body.trim(),
        approved: false,
      },
    });

    return NextResponse.json(
      { ok: true, id: review.id },
      { status: 201, headers: rateLimitHeaders(rl, limit) },
    );
  } catch {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}
