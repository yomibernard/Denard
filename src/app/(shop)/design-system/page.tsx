import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { denardBrand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const colours = [
  { name: "Soft Ivory", hex: denardBrand.colours.softIvory, swatch: "bg-ivory border border-line" },
  { name: "White", hex: denardBrand.colours.white, swatch: "bg-surface border border-line" },
  { name: "Rich Charcoal", hex: denardBrand.colours.richCharcoal, swatch: "bg-ink" },
  { name: "Premium Mint", hex: denardBrand.colours.premiumMint, swatch: "bg-mint" },
  { name: "Deep Mint", hex: denardBrand.colours.deepMint, swatch: "bg-mint-deep" },
  { name: "Mint soft", hex: denardBrand.colours.mintSoft, swatch: "bg-mint-soft" },
  { name: "Champagne Gold", hex: denardBrand.colours.champagneGold, swatch: "bg-gold" },
  { name: "Warm Taupe", hex: denardBrand.colours.warmTaupe, swatch: "bg-taupe" },
  { name: "Amber Fire", hex: denardBrand.colours.amberFire, swatch: "bg-amber" },
];

export default function DesignSystemPage() {
  return (
    <div className="container-denard space-y-16 py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">Brand system</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">Denard design system</h1>
        <p className="mt-4 text-ink-soft">
          Ivory-led, charcoal-structured, mint-accented and gold-refined. Soft Ivory and White
          dominate (~70%). Deep Mint for primary actions. Amber only for sale urgency.
        </p>
      </header>

      <section>
        <h2 className="font-display text-3xl text-ink">Core colours</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {colours.map((c) => (
            <li key={c.name}>
              <div className={`h-20 ${c.swatch}`} />
              <p className="mt-2 text-sm font-medium text-ink">{c.name}</p>
              <p className="text-xs text-muted">{c.hex}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-4 border border-line bg-surface p-5 text-sm text-ink-soft md:grid-cols-2">
          <p>
            <strong className="text-ink">Balance:</strong> Ivory/White ~70% · Charcoal ~18% · Mint
            ~8% · Gold ~3% · Amber ~1%.
          </p>
          <p>
            Never use light mint text on ivory or white. Prefer Deep Mint where contrast matters.
            Do not use Amber as a button colour.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Typography</h2>
        <div className="mt-6 space-y-4">
          <p className="font-display text-5xl text-ink md:text-6xl">Denard</p>
          <p className="font-display text-3xl text-ink">Display — Cormorant Garamond</p>
          <p className="max-w-xl text-base text-ink-soft">
            Body — DM Sans. Prices, filters, navigation and forms stay sans-serif for clarity on
            mobile.
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-taupe">
            Label / eyebrow · Warm Taupe
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Buttons</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Primary Deep Mint · Secondary Charcoal · Soft Premium Mint · Outline Gold · WhatsApp Deep
          Mint
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button>Shop Products</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="soft">Soft mint</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="whatsapp">Chat on WhatsApp</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Badges</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="new">New</Badge>
          <Badge variant="sale">Sale</Badge>
          <Badge variant="featured">Featured</Badge>
          <Badge variant="bestseller">Best seller</Badge>
          <Badge variant="stock">Low stock</Badge>
          <Badge variant="muted">Muted</Badge>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Form fields</h2>
        <div className="mt-6 grid max-w-md gap-4 rounded border border-line bg-surface p-5">
          <div>
            <Label htmlFor="ds-name">Name</Label>
            <Input id="ds-name" placeholder="Ada Okeke" />
          </div>
          <div>
            <Label htmlFor="ds-select">Select</Label>
            <Select id="ds-select" defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              <option value="a">Option A</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="ds-note">Note</Label>
            <Textarea id="ds-note" placeholder="Optional note" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Brand logos</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            "/images/brand/logos/logo-alone-light.png",
            "/images/brand/logos/logo-shade-light.png",
            "/images/brand/logos/icon-light.png",
            "/images/brand/logos/logo-slogan-light.png",
          ].map((src) => (
            <div
              key={src}
              className="flex items-center justify-center border border-line bg-surface p-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="max-h-24 w-auto object-contain" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-ink">Surfaces</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="border border-line bg-ivory p-6">
            <p className="text-sm font-medium text-ink">Ivory canvas</p>
            <p className="mt-1 text-sm text-muted">Main page background</p>
          </div>
          <div className="border border-line bg-surface p-6">
            <p className="text-sm font-medium text-ink">White surface</p>
            <p className="mt-1 text-sm text-muted">Cards, forms, search</p>
          </div>
          <div className="border border-gold/50 bg-mint-soft p-6">
            <p className="text-sm font-medium text-ink">Mint soft + gold edge</p>
            <p className="mt-1 text-sm text-muted">Selected trust / campaign moments</p>
          </div>
        </div>
      </section>
    </div>
  );
}
