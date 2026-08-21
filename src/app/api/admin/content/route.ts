import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin("settings");
  if (!isSession(session)) return session;

  const pages = await prisma.pageContent.findMany({ orderBy: { slug: "asc" } });
  return jsonOk({ pages });
}
