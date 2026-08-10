"use client";

import type { MouseEvent } from "react";
import { Check, Scale } from "lucide-react";
import { useComparison } from "./ComparisonProvider";
import type { CompareEntry } from "@/lib/compare/products";

export function CompareButton({ entry, label = false, className = "" }: { entry: Omit<CompareEntry, "addedAt">; label?: boolean; className?: string }) {
  const comparison = useComparison();
  const selected = comparison.entries.some((item) => item.productHandle === entry.productHandle);
  function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    comparison.toggle(entry);
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} aria-label={selected ? `Remove ${entry.productTitle} from comparison` : `Add ${entry.productTitle} to comparison`} className={`${label ? "inline-flex items-center gap-2" : ""} ${className}`.trim()}>
      {selected ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      {label ? <span>{selected ? "Added to compare" : "Add to compare"}</span> : null}
    </button>
  );
}
