import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type Props = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-ink-950";

export function GoldButton({ href, children, variant = "primary", className, ...buttonProps }: Props) {
  const classes = clsx(
    base,
    variant === "primary"
      ? "bg-gradient-to-br from-gold-200 to-gold-500 text-ink-950 shadow-glow hover:-translate-y-0.5"
      : "border border-gold-500/40 bg-ivory-50/[0.045] text-ivory-50 hover:-translate-y-0.5 hover:border-gold-300/70 hover:bg-ivory-50/[0.07]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
