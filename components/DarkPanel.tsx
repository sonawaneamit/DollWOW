import type { ReactNode } from "react";
import { clsx } from "clsx";

export function DarkPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-[20px] border border-gold-500/18 bg-ink-800/78 shadow-glow backdrop-blur", className)}>
      {children}
    </div>
  );
}
