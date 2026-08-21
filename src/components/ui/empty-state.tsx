import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateAction = {
  href: string;
  label: string;
  variant?: "primary" | "outline" | "whatsapp" | "ghost";
};

export function EmptyState({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center py-16 text-center", className)}>
      {children}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {actions?.length ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={buttonClassName({ variant: a.variant ?? "outline", size: "sm" })}
            >
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
