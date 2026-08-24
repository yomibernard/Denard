import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type DenardLogoProps = {
  variant?: "mark" | "wordmark" | "shade" | "slogan";
  href?: string | null;
  className?: string;
  /** Prefer transparent assets on light surfaces */
  onDark?: boolean;
  priority?: boolean;
};

const ASSETS = {
  mark: {
    light: "/images/brand/logos/icon-light.png",
    dark: "/images/brand/logos/icon.png",
    alt: "Denard",
    width: 432,
    height: 534,
  },
  wordmark: {
    light: "/images/brand/logos/logo-alone-light.png",
    dark: "/images/brand/logos/logo-alone.png",
    alt: "Denard",
    width: 1154,
    height: 341,
  },
  shade: {
    light: "/images/brand/logos/logo-shade-light.png",
    dark: "/images/brand/logos/logo-shade.png",
    alt: "Denard",
    width: 703,
    height: 721,
  },
  slogan: {
    light: "/images/brand/logos/logo-slogan-light.png",
    dark: "/images/brand/logos/logo-slogan.png",
    alt: "Denard — Timeless style, curated for life",
    width: 937,
    height: 670,
  },
} as const;

export function DenardLogo({
  variant = "wordmark",
  href = "/",
  className,
  onDark = false,
  priority = false,
}: DenardLogoProps) {
  const asset = ASSETS[variant];
  const src = onDark ? asset.dark : asset.light;

  const image = (
    <Image
      src={src}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      quality={95}
      sizes="(max-width: 768px) 180px, 220px"
      className={cn(
        "h-auto w-auto max-w-none object-contain object-left",
        variant === "mark" && "h-11 w-auto md:h-12",
        variant === "wordmark" && "h-11 w-auto sm:h-12 md:h-14",
        variant === "shade" && "h-12 w-auto md:h-14",
        variant === "slogan" && "h-24 w-auto md:h-32",
        className,
      )}
    />
  );

  if (href === null) return image;

  return (
    <Link href={href} className="inline-flex items-center focus-ring" aria-label="Denard home">
      {image}
    </Link>
  );
}
