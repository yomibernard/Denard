import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const { searchParams } = new URL(request.url);
  const pendingOnly = searchParams.get("pending") === "1";

  const reviews = await prisma.productReview.findMany({
    where: pendingOnly ? { approved: false } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { id: true, name: true, sku: true } } },
  });
  return jsonOk({ reviews });
}
