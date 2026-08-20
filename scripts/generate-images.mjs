/**
 * Denard fashion brand asset generator
 * Creates editorial SVG placeholders with consistent ratios and brand palette.
 * Replace with photography when available — paths stay stable.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const images = join(root, "public", "images");
const brand = join(images, "brand");
const products = join(images, "products");
const social = join(images, "social");
const empty = join(images, "empty");

for (const d of [brand, products, social, empty]) mkdirSync(d, { recursive: true });

const C = {
  ivory: "#F6F1EA",
  charcoal: "#1F1F1F",
  mint: "#7FAF9B",
  mintDeep: "#356B5A",
  gold: "#C6A46A",
  amber: "#F39C12",
  taupe: "#B7A89A",
  white: "#FFFFFF",
  sand: "#EFE8DF",
};

function write(path, svg) {
  writeFileSync(path, svg);
  console.log("wrote", path.replace(root + "\\", "").replace(root + "/", ""));
}

function esc(t) {
  return String(t)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function editorial({
  w,
  h,
  label,
  sub = "",
  tone = "mint",
  layout = "hero",
}) {
  const accent = tone === "emerald" || tone === "mint" ? C.mintDeep : tone === "gold" ? C.gold : tone === "amber" ? C.amber : C.mint;
  const mid = tone === "emerald" || tone === "mint" ? "#5f9a86" : tone === "gold" ? "#d4b87e" : "#5a8f7d";

  let art = "";
  if (layout === "hero") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.charcoal}"/>
      <rect x="${w * 0.42}" width="${w * 0.58}" height="${h}" fill="${C.ivory}"/>
      <rect x="${w * 0.52}" y="${h * 0.12}" width="${w * 0.28}" height="${h * 0.76}" fill="${accent}" opacity="0.92"/>
      <rect x="${w * 0.62}" y="${h * 0.22}" width="${w * 0.22}" height="${h * 0.56}" fill="${C.taupe}" opacity="0.55"/>
      <line x1="${w * 0.08}" y1="${h * 0.78}" x2="${w * 0.34}" y2="${h * 0.78}" stroke="${C.gold}" stroke-width="1.5"/>
    `;
  } else if (layout === "hero-mobile") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.charcoal}"/>
      <rect y="${h * 0.28}" width="${w}" height="${h * 0.72}" fill="${C.ivory}"/>
      <rect x="${w * 0.18}" y="${h * 0.18}" width="${w * 0.64}" height="${h * 0.62}" fill="${accent}"/>
      <rect x="${w * 0.28}" y="${h * 0.28}" width="${w * 0.44}" height="${h * 0.42}" fill="${C.taupe}" opacity="0.45"/>
      <line x1="${w * 0.1}" y1="${h * 0.88}" x2="${w * 0.4}" y2="${h * 0.88}" stroke="${C.gold}" stroke-width="1.5"/>
    `;
  } else if (layout === "banner") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <rect width="${w * 0.38}" height="${h}" fill="${C.charcoal}"/>
      <rect x="${w * 0.45}" y="${h * 0.15}" width="${w * 0.42}" height="${h * 0.7}" fill="${accent}"/>
      <rect x="${w * 0.55}" y="${h * 0.28}" width="${w * 0.28}" height="${h * 0.44}" fill="${C.sand}" opacity="0.7"/>
      <line x1="${w * 0.06}" y1="${h * 0.72}" x2="${w * 0.28}" y2="${h * 0.72}" stroke="${C.gold}" stroke-width="1.25"/>
    `;
  } else if (layout === "square") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <rect x="${w * 0.18}" y="${h * 0.14}" width="${w * 0.64}" height="${h * 0.72}" fill="${accent}" opacity="0.9"/>
      <rect x="${w * 0.28}" y="${h * 0.26}" width="${w * 0.44}" height="${h * 0.48}" fill="${C.sand}" opacity="0.55"/>
      <circle cx="${w * 0.82}" cy="${h * 0.18}" r="${Math.min(w, h) * 0.04}" fill="${C.gold}"/>
    `;
  } else if (layout === "product") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <rect x="${w * 0.2}" y="${h * 0.12}" width="${w * 0.6}" height="${h * 0.7}" fill="${mid}" opacity="0.85"/>
      <rect x="${w * 0.28}" y="${h * 0.22}" width="${w * 0.44}" height="${h * 0.5}" fill="${C.taupe}" opacity="0.35"/>
      <rect x="${w * 0.22}" y="${h * 0.86}" width="${w * 0.56}" height="2" fill="${C.gold}" opacity="0.7"/>
    `;
  } else if (layout === "product-detail") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <rect x="${w * 0.12}" y="${h * 0.18}" width="${w * 0.76}" height="${h * 0.55}" fill="${accent}" opacity="0.2"/>
      <path d="M${w * 0.2} ${h * 0.55} Q${w * 0.5} ${h * 0.25} ${w * 0.8} ${h * 0.55}" fill="none" stroke="${accent}" stroke-width="8" opacity="0.5"/>
      <text x="${w / 2}" y="${h * 0.78}" text-anchor="middle" fill="${C.taupe}" font-family="Georgia,serif" font-size="18">Fabric detail</text>
    `;
  } else if (layout === "whatsapp") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <rect x="${w * 0.08}" y="${h * 0.12}" width="${w * 0.5}" height="${h * 0.76}" fill="${C.charcoal}"/>
      <rect x="${w * 0.55}" y="${h * 0.28}" width="${w * 0.35}" height="${h * 0.44}" fill="${C.mintDeep}"/>
      <circle cx="${w * 0.72}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.08}" fill="${C.white}" opacity="0.9"/>
      <text x="${w * 0.72}" y="${h * 0.52}" text-anchor="middle" fill="${C.mintDeep}" font-family="system-ui,sans-serif" font-size="22" font-weight="600">wa</text>
    `;
  } else if (layout === "craft") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.sand}"/>
      <rect x="${w * 0.15}" y="${h * 0.2}" width="${w * 0.7}" height="${h * 0.55}" fill="${C.ivory}"/>
      <line x1="${w * 0.22}" y1="${h * 0.35}" x2="${w * 0.78}" y2="${h * 0.35}" stroke="${C.gold}" stroke-width="1"/>
      <line x1="${w * 0.22}" y1="${h * 0.45}" x2="${w * 0.65}" y2="${h * 0.45}" stroke="${C.taupe}" stroke-width="1"/>
      <line x1="${w * 0.22}" y1="${h * 0.55}" x2="${w * 0.7}" y2="${h * 0.55}" stroke="${C.taupe}" stroke-width="1"/>
      <rect x="${w * 0.22}" y="${h * 0.62}" width="${w * 0.18}" height="${h * 0.04}" fill="${C.mintDeep}"/>
    `;
  } else if (layout === "packaging") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <rect x="${w * 0.28}" y="${h * 0.22}" width="${w * 0.44}" height="${h * 0.52}" fill="${C.charcoal}"/>
      <rect x="${w * 0.28}" y="${h * 0.22}" width="${w * 0.44}" height="${h * 0.08}" fill="${C.mintDeep}"/>
      <text x="${w / 2}" y="${h * 0.52}" text-anchor="middle" fill="${C.gold}" font-family="Georgia,serif" font-size="28">Denard</text>
      <rect x="${w * 0.38}" y="${h * 0.78}" width="${w * 0.24}" height="3" fill="${C.gold}"/>
    `;
  } else if (layout === "empty") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.ivory}"/>
      <circle cx="${w / 2}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.12}" fill="none" stroke="${C.gold}" stroke-width="1.5"/>
      <line x1="${w * 0.38}" y1="${h * 0.62}" x2="${w * 0.62}" y2="${h * 0.62}" stroke="${C.taupe}" stroke-width="1.5"/>
    `;
  } else if (layout === "social") {
    art = `
      <rect width="${w}" height="${h}" fill="${C.charcoal}"/>
      <rect y="${h * 0.55}" width="${w}" height="${h * 0.45}" fill="${accent}"/>
      <text x="${w * 0.08}" y="${h * 0.28}" fill="${C.white}" font-family="Georgia,serif" font-size="${Math.round(w * 0.09)}">Denard</text>
      <text x="${w * 0.08}" y="${h * 0.7}" fill="${C.white}" font-family="system-ui,sans-serif" font-size="${Math.round(w * 0.045)}" font-weight="500">${esc(label)}</text>
    `;
  } else {
    art = `<rect width="${w}" height="${h}" fill="${C.ivory}"/>`;
  }

  const labelY = layout === "social" ? h - 24 : h - 28;
  const showLabel = layout !== "social" && label;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  ${art}
  ${showLabel ? `<text x="32" y="${labelY}" fill="${layout.includes("hero") || layout === "banner" ? C.white : C.charcoal}" font-family="Georgia,serif" font-size="22" opacity="0.85">${esc(label)}</text>` : ""}
  ${sub && showLabel ? `<text x="32" y="${labelY + 22}" fill="${C.taupe}" font-family="system-ui,sans-serif" font-size="12">${esc(sub)}</text>` : ""}
</svg>`;
}

// —— Brand campaign & banners ——
const brandAssets = [
  { file: "hero-desktop.svg", w: 1920, h: 900, label: "Denard AW Edit", layout: "hero", tone: "mint" },
  { file: "hero-mobile.svg", w: 750, h: 1100, label: "Denard", layout: "hero-mobile", tone: "mint" },
  { file: "banner-women.svg", w: 1600, h: 900, label: "Women", sub: "Collection", layout: "banner", tone: "mint" },
  { file: "banner-men.svg", w: 1600, h: 900, label: "Men", sub: "Collection", layout: "banner", tone: "mint" },
  { file: "banner-accessories.svg", w: 1600, h: 900, label: "Accessories", layout: "banner", tone: "gold" },
  { file: "campaign-new-arrivals.svg", w: 1600, h: 900, label: "New Arrivals", layout: "banner", tone: "mint" },
  { file: "campaign-best-sellers.svg", w: 1600, h: 900, label: "Best Sellers", layout: "banner", tone: "mint" },
  { file: "whatsapp-shopping.svg", w: 1200, h: 800, label: "WhatsApp shopping", layout: "whatsapp", tone: "mint" },
  { file: "about-craftsmanship.svg", w: 1400, h: 900, label: "Craftsmanship", layout: "craft", tone: "gold" },
  { file: "packaging.svg", w: 1000, h: 1000, label: "Packaging", layout: "packaging", tone: "mint" },
  { file: "promo-banner.svg", w: 1600, h: 500, label: "Seasonal offer", layout: "banner", tone: "amber" },
  { file: "category-women.svg", w: 800, h: 800, label: "Women", layout: "square", tone: "mint" },
  { file: "category-men.svg", w: 800, h: 800, label: "Men", layout: "square", tone: "mint" },
  { file: "category-accessories.svg", w: 800, h: 800, label: "Accessories", layout: "square", tone: "gold" },
  { file: "category-new.svg", w: 800, h: 800, label: "New", layout: "square", tone: "mint" },
];

for (const a of brandAssets) {
  write(
    join(brand, a.file),
    editorial({ w: a.w, h: a.h, label: a.label, sub: a.sub, tone: a.tone, layout: a.layout }),
  );
}

// Legacy paths used by seed / older pages
write(join(images, "hero.svg"), editorial({ w: 1920, h: 900, label: "Denard", layout: "hero", tone: "mint" }));
write(join(images, "dept-fashion.svg"), editorial({ w: 800, h: 1000, label: "Fashion", layout: "square", tone: "mint" }));
write(join(images, "dept-home.svg"), editorial({ w: 800, h: 1000, label: "Home", layout: "square", tone: "gold" }));
write(join(images, "dept-beauty.svg"), editorial({ w: 800, h: 1000, label: "Beauty", layout: "square", tone: "mint" }));
write(join(images, "dept-electronics.svg"), editorial({ w: 800, h: 1000, label: "Electronics", layout: "square", tone: "mint" }));
write(join(images, "collection-formal.svg"), editorial({ w: 1600, h: 1000, label: "Formal Wear", layout: "banner", tone: "mint" }));
write(join(images, "collection-everyday.svg"), editorial({ w: 1600, h: 1000, label: "Everyday", layout: "banner", tone: "mint" }));
write(join(images, "collection-home.svg"), editorial({ w: 1600, h: 1000, label: "Calm Home", layout: "banner", tone: "gold" }));

// Products — consistent 3:4, neutral ivory, front + alternate views
const PRODUCT_SLUGS = [
  ["classic-long-sleeve-shirt", "mint"],
  ["linen-resort-shirt", "gold"],
  ["structured-midi-dress", "mint"],
  ["wool-blend-overcoat", "mint"],
  ["ceramic-table-lamp", "gold"],
  ["linen-throw-blanket", "mint"],
  ["daily-balance-moisturiser", "mint"],
  ["wireless-compact-earbuds", "mint"],
  ["leather-crossbody-bag", "mint"],
  ["minimal-desk-speaker", "gold"],
];

for (const [slug, tone] of PRODUCT_SLUGS) {
  write(
    join(products, `${slug}-1.svg`),
    editorial({ w: 900, h: 1200, label: slug.replaceAll("-", " "), layout: "product", tone }),
  );
  write(
    join(products, `${slug}-2.svg`),
    editorial({ w: 900, h: 1200, label: "Alternate view", layout: "product-detail", tone }),
  );
  // Extra PDP angles
  for (const [suffix, layout, label] of [
    ["front", "product", "Front"],
    ["back", "product", "Back"],
    ["side", "product", "Side"],
    ["detail", "product-detail", "Detail"],
  ]) {
    write(
      join(products, `${slug}-${suffix}.svg`),
      editorial({ w: 900, h: 1200, label, layout, tone }),
    );
  }
}

// Empty states
for (const [name, label] of [
  ["enquiry-empty", "Your enquiry list is empty"],
  ["wishlist-empty", "Save pieces you love"],
  ["search-empty", "No matches found"],
  ["compare-empty", "Compare up to four pieces"],
]) {
  write(join(empty, `${name}.svg`), editorial({ w: 640, h: 480, label, layout: "empty", tone: "gold" }));
}

// Social templates
for (const [name, label, tone] of [
  ["story-new-arrivals", "New Arrivals", "mint"],
  ["feed-best-sellers", "Best Sellers", "mint"],
  ["story-sale", "Limited offer", "amber"],
  ["feed-brand", "Timeless style", "mint"],
]) {
  write(join(social, `${name}.svg`), editorial({ w: 1080, h: 1080, label, layout: "social", tone }));
  write(
    join(social, `${name}-story.svg`),
    editorial({ w: 1080, h: 1920, label, layout: "social", tone }),
  );
}

console.log("\nDenard brand assets generated.");
