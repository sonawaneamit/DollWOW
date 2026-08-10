"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function ResponsiveDetails({
  id,
  className,
  labelledBy,
  summary,
  children
}: {
  id: string;
  className?: string;
  labelledBy?: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) detailsRef.current?.removeAttribute("open");
  }, []);

  return (
    <details ref={detailsRef} id={id} className={className} aria-labelledby={labelledBy} open>
      {summary}
      {children}
    </details>
  );
}
