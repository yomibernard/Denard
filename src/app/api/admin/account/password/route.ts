import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  assertStrongPassword,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(200),
});

/** Any logged-in admin can change their own password. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid request", 400);

    const strength = assertStrongPassword(parsed.data.newPassword);
    if (strength) return jsonError(strength, 400);

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return jsonError("User not found", 404);

    const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return jsonError("Current password is incorrect", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    return jsonOk({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, 500);
  }
}
