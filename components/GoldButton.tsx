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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-ink-950";

export function GoldButton({ href, children, variant = "primary", className, ...buttonProps }: Props) {
  const classes = clsx(
    base,
    variant === "primary"
      ? "bg-gold-400 text-ink-950 hover:bg-gold-300"
      : "border border-gold-500/55 bg-ink-800/60 text-gold-300 hover:border-gold-300 hover:bg-ink-750",
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
