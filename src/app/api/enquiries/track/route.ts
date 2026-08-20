import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().min(3).max(40),
  phone: z.string().min(7).max(40),
});

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

async function lookup(reference: string, phone: string) {
  const enquiry = await prisma.enquiry.findFirst({
    where: { reference: reference.trim().toUpperCase() },
    include: { _count: { select: { items: true } } },
  });
  if (!enquiry) return null;

  const stored = normalizePhone(enquiry.customerPhone);
  const given = normalizePhone(phone);
  if (!stored || !given) return null;
  const match =
    stored === given ||
    stored.endsWith(given.slice(-7)) ||
    given.endsWith(stored.slice(-7));
  if (!match) return null;

  return {
    reference: enquiry.reference,
    status: enquiry.status,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
    itemCount: enquiry._count.items,
    estimatedTotal: enquiry.estimatedTotal,
    currency: enquiry.currency,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const result = await lookup(parsed.data.reference, parsed.data.phone);
    if (!result) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const parsed = schema.safeParse({ reference, phone });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = await lookup(parsed.data.reference, parsed.data.phone);
  if (!result) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
