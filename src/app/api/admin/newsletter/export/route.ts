import { isSession, requireAdmin } from "@/lib/admin-api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin("reports");
  if (!isSession(session)) return session;

  const setting = await prisma.siteSetting.findUnique({ where: { key: "newsletter_emails" } });
  const emails = (setting?.value ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const lines = ["email", ...emails];
  const csv = lines.join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="denard-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
