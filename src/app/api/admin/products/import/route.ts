import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSession, jsonError, jsonOk, requireAdmin } from "@/lib/admin-api";
import { slugify } from "@/lib/utils";
import type { AvailabilityStatus, ProductStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/**
 * CSV columns (header row required):
 * sku,name,price,slug?,status?,availability?,stockQty?,shortDescription?,compareAtPrice?
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some((c) => c.length)) rows.push(row);
  }
  return rows;
}

export async function POST(request: Request) {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let csvText = "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("CSV file required");
      csvText = await file.text();
    } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      csvText = await request.text();
    } else {
      const body = await request.json().catch(() => null);
      csvText = String(body?.csv ?? "");
    }

    const rows = parseCsv(csvText);
    if (rows.length < 2) return jsonError("CSV needs a header row and at least one product");

    const header = rows[0].map((h) => h.toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    if (idx("sku") < 0 || idx("name") < 0 || idx("price") < 0) {
      return jsonError("CSV must include sku, name, and price columns");
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const get = (name: string) => {
        const j = idx(name);
        return j >= 0 ? cols[j] ?? "" : "";
      };
      const sku = get("sku").trim();
      const name = get("name").trim();
      const price = Number(get("price"));
      if (!sku || !name || Number.isNaN(price)) {
        errors.push(`Row ${i + 1}: missing sku/name/price`);
        continue;
      }

      const slug = (get("slug") || slugify(name)).trim() || slugify(name);
      const status = (get("status") || "DRAFT").toUpperCase() as ProductStatus;
      const availability = (get("availability") || "IN_STOCK").toUpperCase() as AvailabilityStatus;
      const stockRaw = get("stockqty") || get("stock");
      const stockQty = stockRaw ? Number(stockRaw) : null;
      const compareRaw = get("compareatprice");
      const compareAtPrice = compareRaw ? Number(compareRaw) : null;
      const shortDescription = get("shortdescription") || null;

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name,
            slug,
            price,
            compareAtPrice: Number.isNaN(compareAtPrice as number) ? null : compareAtPrice,
            status,
            availability,
            stockQty: stockQty != null && !Number.isNaN(stockQty) ? stockQty : undefined,
            shortDescription,
            publishedAt:
              status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
          },
        });
        updated += 1;
      } else {
        await prisma.product.create({
          data: {
            sku,
            name,
            slug,
            price,
            compareAtPrice: Number.isNaN(compareAtPrice as number) ? null : compareAtPrice,
            status,
            availability,
            stockQty: stockQty != null && !Number.isNaN(stockQty) ? stockQty : null,
            shortDescription,
            publishedAt: status === "PUBLISHED" ? new Date() : null,
          },
        });
        created += 1;
      }
    }

    return jsonOk({ created, updated, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return jsonError(message, 500);
  }
}

export async function GET() {
  const session = await requireAdmin("products");
  if (!isSession(session)) return session;

  const sample =
    "sku,name,price,slug,status,availability,stockQty,shortDescription,compareAtPrice\n" +
    "DN-SAMPLE-01,Sample Gold Hoop,42,sample-gold-hoop,DRAFT,IN_STOCK,10,Everyday hoop earring,\n";

  return new NextResponse(sample, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="denard-product-import-template.csv"',
    },
  });
}
