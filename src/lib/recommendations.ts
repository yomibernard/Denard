import "server-only";
import { prisma } from "@/lib/db";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import type { StylePrefs } from "@/lib/style-prefs";
import { prefsAreEmpty } from "@/lib/style-prefs";

export type RecommendInput = {
  seedIds?: string[];
  prefs?: StylePrefs;
  excludeIds?: string[];
  limit?: number;
};

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 2 },
  brand: true,
  variants: {
    where: { active: true },
    include: { colour: true, size: true },
  },
  categories: { include: { category: true } },
  collections: { include: { collection: true } },
  materials: { include: { material: true } },
  tags: { include: { tag: true } },
} as const;

type ScoredProduct = Awaited<ReturnType<typeof loadCandidates>>[number] & { score: number; reasons: string[] };

function normalizeIds(ids: string[] | undefined, max = 24) {
  return [...new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))].slice(0, max);
}

function textBlob(p: {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  brand?: { name: string } | null;
  categories: Array<{ category: { name: string; slug: string } }>;
  collections: Array<{ collection: { name: string; slug: string } }>;
  materials: Array<{ material: { name: string; slug: string } }>;
  tags: Array<{ tag: { name: string; slug: string } }>;
  variants: Array<{ colour?: { name: string; slug: string } | null }>;
}) {
  return [
    p.name,
    p.shortDescription,
    p.description,
    p.brand?.name,
    ...p.categories.map((c) => `${c.category.name} ${c.category.slug}`),
    ...p.collections.map((c) => `${c.collection.name} ${c.collection.slug}`),
    ...p.materials.map((m) => `${m.material.name} ${m.material.slug}`),
    ...p.tags.map((t) => `${t.tag.name} ${t.tag.slug}`),
    ...p.variants.map((v) => v.colour?.name ?? ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

async function loadCandidates(exclude: Set<string>) {
  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      availability: { not: "OUT_OF_STOCK" },
      ...(exclude.size ? { id: { notIn: [...exclude] } } : {}),
    },
    include: cardInclude,
    orderBy: [{ isFeatured: "desc" }, { enquiryCount: "desc" }, { publishedAt: "desc" }],
    take: 120,
  });
}

function scoreAgainstSeeds(
  candidate: Awaited<ReturnType<typeof loadCandidates>>[number],
  seeds: Awaited<ReturnType<typeof loadCandidates>>,
) {
  let score = 0;
  const reasons: string[] = [];
  const cat = new Set(candidate.categories.map((c) => c.categoryId));
  const col = new Set(candidate.collections.map((c) => c.collectionId));
  const mat = new Set(candidate.materials.map((m) => m.materialId));
  const colours = new Set(
    candidate.variants.map((v) => v.colourId).filter(Boolean) as string[],
  );
  const brandId = candidate.brandId;

  for (const seed of seeds) {
    for (const c of seed.categories) {
      if (cat.has(c.categoryId)) {
        score += 5;
        reasons.push(`Like your interest in ${c.category.name}`);
      }
    }
    for (const c of seed.collections) {
      if (col.has(c.collectionId)) {
        score += 4;
        reasons.push(`Fits ${c.collection.name}`);
      }
    }
    for (const m of seed.materials) {
      if (mat.has(m.materialId)) {
        score += 3;
        reasons.push(`Similar material: ${m.material.name}`);
      }
    }
    for (const v of seed.variants) {
      if (v.colourId && colours.has(v.colourId)) {
        score += 3;
        reasons.push(`Matches ${v.colour?.name ?? "your colour"}`);
      }
    }
    if (brandId && seed.brandId === brandId) {
      score += 2;
      reasons.push(`Same house as ${seed.brand?.name ?? "pieces you viewed"}`);
    }
  }

  return { score, reasons };
}

function scoreAgainstPrefs(
  candidate: Awaited<ReturnType<typeof loadCandidates>>[number],
  prefs: StylePrefs,
) {
  let score = 0;
  const reasons: string[] = [];
  const blob = textBlob(candidate);

  for (const focus of prefs.focuses) {
    if (blob.includes(focus)) {
      score += 4;
      reasons.push(`Aligned with ${focus}`);
    }
  }
  for (const metal of prefs.metals) {
    const needles =
      metal === "rose"
        ? ["rose", "rose gold", "rosegold"]
        : metal === "gold"
          ? ["gold", "gilt", "champagne"]
          : metal === "silver"
            ? ["silver", "steel", "rhodium", "white"]
            : ["mixed", "two-tone", "bi-colour", "bicolor"];
    if (needles.some((n) => blob.includes(n))) {
      score += 3;
      reasons.push(`${metal} tones`);
    }
  }
  for (const vibe of prefs.vibes) {
    const map: Record<string, string[]> = {
      minimal: ["minimal", "simple", "delicate", "fine", "slim"],
      statement: ["statement", "bold", "chunky", "dramatic", "pave", "pavé"],
      classic: ["classic", "timeless", "elegant", "heritage"],
      playful: ["playful", "colour", "bead", "fun", "bright"],
    };
    if ((map[vibe] ?? []).some((n) => blob.includes(n))) {
      score += 2;
      reasons.push(`${vibe} feel`);
    }
  }
  for (const occasion of prefs.occasions) {
    const map: Record<string, string[]> = {
      everyday: ["everyday", "daily", "casual", "stack"],
      evening: ["evening", "occasion", "party", "drop", "statement"],
      work: ["work", "office", "polished", "refined"],
      gift: ["gift", "box", "present"],
    };
    if ((map[occasion] ?? []).some((n) => blob.includes(n))) {
      score += 2;
      reasons.push(`Works for ${occasion}`);
    }
  }
  if (prefs.budgetMax != null) {
    if (candidate.price <= prefs.budgetMax) {
      score += 3;
      reasons.push("Within your budget guide");
    } else {
      score -= 4;
    }
  }

  return { score, reasons };
}

function toCard(p: Awaited<ReturnType<typeof loadCandidates>>[number], reasons: string[]) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    shortDescription: p.shortDescription,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    currency: p.currency,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isOnOffer: p.isOnOffer,
    availability: p.availability,
    images: p.images.map((img) => ({
      ...img,
      url: normalizePublicMediaUrl(img.url),
    })),
    brand: p.brand,
    variants: p.variants,
    reason: [...new Set(reasons)].slice(0, 2).join(" · ") || "Curated for you",
  };
}

/** Build a lightweight taste profile narrative from seeds + prefs. */
export function buildTasteNarrative(
  seedNames: string[],
  prefs: StylePrefs,
): string {
  const parts: string[] = [];
  if (seedNames.length) {
    parts.push(
      `You’ve been looking at ${seedNames.slice(0, 3).join(", ")}${seedNames.length > 3 ? " and more" : ""}.`,
    );
  }
  if (!prefsAreEmpty(prefs)) {
    if (prefs.vibes.length) parts.push(`You lean ${prefs.vibes.join(" / ")}.`);
    if (prefs.metals.length) parts.push(`Metal preference: ${prefs.metals.join(", ")}.`);
    if (prefs.occasions.length) parts.push(`Occasions: ${prefs.occasions.join(", ")}.`);
    if (prefs.budgetMax != null) parts.push(`Guide budget up to £${prefs.budgetMax}.`);
  }
  if (!parts.length) {
    return "Browse a few pieces or set your style preferences — Denard will propose what fits.";
  }
  return parts.join(" ");
}

export async function recommendProducts(input: RecommendInput) {
  const seedIds = normalizeIds(input.seedIds);
  const exclude = new Set([...normalizeIds(input.excludeIds), ...seedIds]);
  const limit = Math.min(12, Math.max(1, input.limit ?? 8));
  const prefs = input.prefs ?? {
    occasions: [],
    metals: [],
    vibes: [],
    focuses: [],
    budgetMax: null,
  };

  const seeds = seedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: seedIds }, status: "PUBLISHED" },
        include: cardInclude,
      })
    : [];

  // Preserve seed order for narrative
  const seedOrder = new Map(seedIds.map((id, i) => [id, i]));
  seeds.sort((a, b) => (seedOrder.get(a.id) ?? 0) - (seedOrder.get(b.id) ?? 0));

  const candidates = await loadCandidates(exclude);
  const scored: ScoredProduct[] = candidates.map((c) => {
    const fromSeeds = seeds.length ? scoreAgainstSeeds(c, seeds) : { score: 0, reasons: [] as string[] };
    const fromPrefs = prefsAreEmpty(prefs) ? { score: 0, reasons: [] as string[] } : scoreAgainstPrefs(c, prefs);
    let score = fromSeeds.score + fromPrefs.score;
    const reasons = [...fromSeeds.reasons, ...fromPrefs.reasons];
    if (c.isFeatured) score += 1;
    if (c.isBestSeller) score += 1;
    if (c.isNew) score += 0.5;
    score += Math.min(2, c.enquiryCount / 20);
    return { ...c, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score || b.enquiryCount - a.enquiryCount);

  // If nothing scored (cold start), fall back to featured / popular
  const top =
    scored.some((s) => s.score > 0)
      ? scored.filter((s) => s.score > 0).slice(0, limit)
      : scored.slice(0, limit);

  return {
    products: top.map((p) => toCard(p, p.reasons)),
    narrative: buildTasteNarrative(
      seeds.map((s) => s.name),
      prefs,
    ),
    coldStart: !seeds.length && prefsAreEmpty(prefs),
  };
}

/** Optional LLM polish for style notes when OPENAI_API_KEY is set. */
export async function polishStyleAdvice(opts: {
  narrative: string;
  productNames: string[];
  prefs: StylePrefs;
}) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return buildFallbackAdvice(opts);
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_STYLE_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "You are Denard’s UK fashion & jewellery style concierge. Write 2–3 short sentences: warm, specific, no hype, no emojis. Suggest how the listed pieces work together. GBP boutique tone. Do not invent stock or prices.",
          },
          {
            role: "user",
            content: JSON.stringify({
              taste: opts.narrative,
              prefs: opts.prefs,
              proposed: opts.productNames,
            }),
          },
        ],
      }),
    });
    if (!res.ok) return buildFallbackAdvice(opts);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || buildFallbackAdvice(opts);
  } catch {
    return buildFallbackAdvice(opts);
  }
}

function buildFallbackAdvice(opts: {
  narrative: string;
  productNames: string[];
  prefs: StylePrefs;
}) {
  const picks = opts.productNames.slice(0, 3);
  if (!picks.length) {
    return `${opts.narrative} Save a few favourites or tell us your metals and occasions — we’ll propose a tighter edit.`;
  }
  const vibe = opts.prefs.vibes[0] ? ` with a ${opts.prefs.vibes[0]} lean` : "";
  return `${opts.narrative} Based on that, start with ${picks.join(", ")}${vibe}. Add one quieter piece to balance a statement, or message us on WhatsApp for a personal edit.`;
}
