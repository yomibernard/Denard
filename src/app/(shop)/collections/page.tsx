import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/product/breadcrumbs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated Denard product collections.",
};

export default async function CollectionsIndexPage() {
  const collections = await prisma.collection.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="container-denard py-8 md:py-12">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Collections" }]}
        className="mb-5"
      />
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl md:text-4xl text-ink">Collections</h1>
        <p className="mt-2 text-ink-soft">Curated edits from the Denard catalogue.</p>
      </header>

      {collections.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collection/${c.slug}`}
              className="group relative aspect-[4/3] overflow-hidden bg-sand"
            >
              <Image
                src={c.imageUrl || c.bannerUrl || "/images/hero.svg"}
                alt={c.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width:768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h2 className="font-display text-2xl">{c.name}</h2>
                {c.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-white/80">{c.description}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
