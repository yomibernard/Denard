"use client";

import Image from "next/image";
import Link from "next/link";

const FEED = [
  {
    src: "/images/social/feed-brand.svg",
    alt: "Denard brand story",
    href: "https://www.instagram.com/",
  },
  {
    src: "/images/social/story-new-arrivals.svg",
    alt: "New arrivals on Instagram",
    href: "https://www.instagram.com/",
  },
  {
    src: "/images/social/feed-best-sellers.svg",
    alt: "Best sellers edit",
    href: "https://www.instagram.com/",
  },
  {
    src: "/images/social/story-sale.svg",
    alt: "Offers and seasonal edits",
    href: "https://www.instagram.com/",
  },
];

export function InstagramStrip() {
  return (
    <section className="border-t border-line bg-surface py-14 md:py-20">
      <div className="container-denard">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">@denard</p>
            <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">On Instagram</h2>
            <p className="mt-2 max-w-md text-sm text-ink-soft">
              Style notes, new jewellery and behind-the-scenes from England.
            </p>
          </div>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            Follow Denard
          </a>
        </div>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {FEED.map((item) => (
            <li key={item.src}>
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-sand"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:768px) 50vw, 25vw"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
