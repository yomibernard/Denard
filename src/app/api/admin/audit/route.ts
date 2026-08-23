import { prisma } from "@/lib/db";
import { isSession, jsonOk, requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdmin("enquiries");
  if (!isSession(session)) return session;

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId") ?? undefined;
  const entityType = searchParams.get("entityType") ?? undefined;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entityId ? { entityId } : {}),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { user: { select: { name: true, email: true } } },
  });

  return jsonOk({ logs });
}
