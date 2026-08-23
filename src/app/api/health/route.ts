import { NextResponse } from "next/server";
import { checkEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { mediaStorageMode } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = checkEnv();
  let database: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch {
    database = "down";
  }

  const ok = env.ok && database === "up";
  const body = {
    ok,
    service: "denard",
    time: new Date().toISOString(),
    database,
    media: mediaStorageMode(),
    uptimeSec: Math.round(process.uptime()),
    env: {
      ok: env.ok,
      errors: env.errors,
      warnings: env.warnings,
    },
  };

  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
