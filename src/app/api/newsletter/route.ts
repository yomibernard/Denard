import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email().max(200),
});

export async function POST(request: Request) {
  const limit = 8;
  const rl = rateLimit({
    key: `newsletter:${clientIp(request)}`,
    limit,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(rl, limit) },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let email = "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = String(body.email ?? "");
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "");
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = schema.safeParse({ email: email.trim().toLowerCase() });
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const address = parsed.data.email;

  await prisma.analyticsEvent.create({
    data: {
      eventName: "newsletter_signup",
      metaJson: JSON.stringify({ email: address }),
    },
  });

  const key = "newsletter_emails";
  const existing = await prisma.siteSetting.findUnique({ where: { key } });
  const list = existing?.value
    ? existing.value.split(",").map((e) => e.trim()).filter(Boolean)
    : [];
  if (!list.includes(address)) {
    list.push(address);
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: list.join(",") },
      update: { value: list.join(",") },
    });
  }

  const referer = request.headers.get("referer");
  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl, limit) });
  }

  const redirectTo = referer || "/";
  return NextResponse.redirect(new URL(redirectTo), 303);
}
