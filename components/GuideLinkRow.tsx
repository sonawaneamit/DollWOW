"use client";

import type { ReactNode } from "react";

type HorizontalRow = {
  scrollLeft: number;
  getBoundingClientRect(): Pick<DOMRect, "left" | "right">;
  scrollTo(options: ScrollToOptions): void;
};

export function revealFocusedGuide(row: HorizontalRow, link: Pick<HTMLElement, "getBoundingClientRect">) {
  const bounds = row.getBoundingClientRect();
  const target = link.getBoundingClientRect();
  const delta = target.left < bounds.left ? target.left - bounds.left : target.right > bounds.right ? target.right - bounds.right : 0;
  if (delta) row.scrollTo({ left: Math.max(0, row.scrollLeft + delta), behavior: "instant" });
}

export function GuideLinkRow({ label, className, tabIndex, previewFocusScrolling = false, children }: {
  label: string;
  className: string;
  tabIndex?: number;
  previewFocusScrolling?: boolean;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label} className={className} tabIndex={tabIndex} onFocusCapture={previewFocusScrolling ? (event) => {
      if (event.target instanceof HTMLAnchorElement) revealFocusedGuide(event.currentTarget, event.target);
    } : undefined}>
      {children}
    </nav>
  );
}
