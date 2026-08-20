import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";

export async function PATCH(request: Request) {
  const session = await requireAdmin("settings", ["SUPER_ADMIN", "BUSINESS_OWNER"]);
  if (!isSession(session)) return session;

  try {
    const body = await request.json();
    const settings = body.settings as Record<string, string> | undefined;
    if (!settings || typeof settings !== "object") {
      return jsonError("settings object required");
    }

    const entries = Object.entries(settings).filter(
      ([key, value]) => key && typeof value === "string",
    );

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );

    const all = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
    return jsonOk({ settings: all });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
