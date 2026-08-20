import { NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const data = await searchSuggestions(q);
  return NextResponse.json(data);
}
