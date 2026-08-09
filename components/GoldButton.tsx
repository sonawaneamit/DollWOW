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
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-button px-5 py-3 text-[17px] font-semibold transition-colors duration-200";

export function GoldButton({ href, children, variant = "primary", className, ...buttonProps }: Props) {
  const classes = clsx(
    base,
    variant === "primary"
      ? "bg-accent text-white shadow-card hover:bg-accent-hover"
      : "border-2 border-accent bg-transparent text-accent hover:bg-accent-tint",
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
