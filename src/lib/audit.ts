import "server-only";
import { prisma } from "@/lib/db";

export async function writeAudit(opts: {
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: unknown;
  userId?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        details:
          opts.details === undefined
            ? null
            : typeof opts.details === "string"
              ? opts.details.slice(0, 4000)
              : JSON.stringify(opts.details).slice(0, 4000),
        userId: opts.userId ?? null,
      },
    });
  } catch (err) {
    console.warn("[denard] audit log skipped", err);
  }
}

export const logAudit = writeAudit;
