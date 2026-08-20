import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Badge hierarchy:
 * sale       → Amber Fire only
 * new        → Premium Mint (soft brand moment)
 * featured   → Charcoal
 * bestseller → Mint soft + Deep Mint text (contrast)
 * stock      → Taupe / sand
 */
const variants = {
  new: "bg-mint text-ink",
  sale: "bg-amber text-ink",
  featured: "bg-ink text-white",
  bestseller: "bg-mint-soft text-mint-deep",
  stock: "bg-sand text-ink-soft",
  muted: "bg-sand text-muted",
} as const;

export type BadgeVariant = keyof typeof variants;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "muted", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
        "rounded-[var(--denard-radius)]",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
