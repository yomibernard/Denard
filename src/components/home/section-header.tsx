import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "View all",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 self-start pb-0.5 text-sm font-medium text-mint-deep transition-colors hover:text-accent-hover sm:self-end"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      ) : null}
    </div>
  );
}
