import type { ReactNode } from "react";
import { clsx } from "clsx";

export function DarkPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-lg bg-surface text-text shadow-card", className)}>
      {children}
    </div>
  );
}
