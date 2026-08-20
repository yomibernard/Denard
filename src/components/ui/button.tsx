import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Denard button system (mint-led)
 * Primary   = Deep Mint #356B5A
 * Secondary = Charcoal #1F1F1F
 * Soft      = Premium Mint #7FAF9B
 * Outline   = Champagne Gold border
 * WhatsApp  = Deep Mint
 */
const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent",
  secondary:
    "bg-secondary text-white hover:bg-secondary-hover focus-visible:ring-secondary",
  soft: "bg-mint text-ink hover:bg-mint-hover focus-visible:ring-mint",
  outline:
    "border border-gold bg-transparent text-ink hover:bg-ivory focus-visible:ring-gold",
  ghost:
    "bg-transparent text-ink-soft hover:bg-sand hover:text-ink focus-visible:ring-accent",
  whatsapp:
    "bg-whatsapp text-white hover:bg-whatsapp-hover focus-visible:ring-whatsapp",
  danger:
    "bg-danger text-white hover:bg-[#733030] focus-visible:ring-danger",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-xs gap-1.5 tracking-[0.04em]",
  md: "h-11 px-5 text-sm gap-2 tracking-[0.04em]",
  lg: "h-12 px-7 text-[0.9375rem] gap-2.5 tracking-[0.05em]",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  children?: ReactNode;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center font-medium uppercase transition-colors duration-200",
    "rounded-[var(--denard-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    asChild: _asChild,
    type = "button",
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});
