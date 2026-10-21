"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HALLOWEEN_2026, isHalloweenInWindow } from "@/lib/promotions/halloween2026";

export function useHalloweenWindow(preview = false) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    if (preview) return;
    const check = () => setActive(isHalloweenInWindow());
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [preview]);
  return active;
}

export function HalloweenWindow({ children, preview = false }: { children: ReactNode; preview?: boolean }) {
  const active = useHalloweenWindow(preview);
  return active ? children : <p className="py-6">The Halloween offer ended on {HALLOWEEN_2026.endLabel}. Explore current brand offers below.</p>;
}
