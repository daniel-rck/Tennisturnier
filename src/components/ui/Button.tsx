import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-4 py-2 text-sm min-h-[44px]",
  lg: "px-6 py-3 text-base min-h-[52px]",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:bg-surface-sunken disabled:text-fg-subtle disabled:border disabled:border-dashed disabled:border-border-strong disabled:cursor-not-allowed",
  secondary:
    "bg-surface text-fg border border-border-strong hover:border-brand-hover hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-fg-muted hover:text-fg hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-danger-fg text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
  gold: "bg-gold text-court-deep font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-card",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand",
        SIZES[size],
        VARIANTS[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
