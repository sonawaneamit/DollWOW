"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Scale, Trash2, X } from "lucide-react";
import { MAX_COMPARE_ENTRIES } from "@/lib/compare/products";
import { useComparison } from "./ComparisonProvider";

export function ComparisonDrawer() {
  const comparison = useComparison();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!comparison.drawerOpen) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") comparison.closeDrawer();
      if (event.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [comparison.drawerOpen, comparison.closeDrawer]);

  if (!comparison.drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-[97]" role="dialog" aria-modal="true" aria-label="Compare dolls">
      <button type="button" aria-label="Dismiss comparison drawer" className="absolute inset-0 bg-black/62" onClick={comparison.closeDrawer} />
      <aside ref={panelRef} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-soft">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-accent">Compare dolls</p>
            <p className="mt-1 text-sm text-text-dim">{comparison.entries.length} of {MAX_COMPARE_ENTRIES} selected</p>
          </div>
          <button ref={closeRef} type="button" onClick={comparison.closeDrawer} className="flex h-11 w-11 items-center justify-center rounded-sm border border-border text-text-dim hover:border-accent hover:text-text" aria-label="Close comparison">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {comparison.entries.length ? (
            <ul className="grid gap-3">
              {comparison.entries.map((entry) => (
                <li key={entry.productHandle} className="flex gap-3 rounded-md border border-border bg-surface-tint p-3">
                  <Link href={`/products/${entry.productHandle}`} onClick={comparison.closeDrawer} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-bg">
                    {entry.imageUrl ? <Image src={entry.imageUrl} alt={entry.productTitle} fill sizes="80px" className="object-cover" /> : <Scale className="m-auto h-6 w-6 text-accent" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-accent">{entry.brand}</p>
                    <Link href={`/products/${entry.productHandle}`} onClick={comparison.closeDrawer} className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-text hover:text-accent">{entry.productTitle}</Link>
                    <p className="mt-2 text-sm text-text-dim">{[entry.material, entry.heightCm ? `${entry.heightCm} cm` : null].filter(Boolean).join(" · ")}</p>
                  </div>
                  <button type="button" onClick={() => comparison.remove(entry.productHandle)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-text-dim hover:bg-bg hover:text-danger" aria-label={`Remove ${entry.productTitle}`}><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md bg-surface-tint p-7 text-center">
              <Scale className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-3 font-semibold text-text">No dolls selected</p>
              <p className="mt-2 text-sm leading-6 text-text-dim">Add up to four dolls while browsing, then compare their details side by side.</p>
            </div>
          )}
          {comparison.entries.length >= MAX_COMPARE_ENTRIES ? <p className="mt-4 rounded-sm bg-accent-tint p-3 text-sm text-text">Four is the maximum so the comparison stays readable.</p> : null}
        </div>
        <footer className="border-t border-border p-5">
          <Link href="/compare" onClick={comparison.closeDrawer} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-button px-5 text-base font-semibold ${comparison.entries.length >= 2 ? "bg-accent text-white shadow-card" : "pointer-events-none bg-surface-tint text-text-faint"}`} aria-disabled={comparison.entries.length < 2}>
            Compare {comparison.entries.length || "dolls"} <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-3 flex items-center justify-between text-sm">
            <Link href="/shop" onClick={comparison.closeDrawer} className="font-semibold text-accent">Add another doll</Link>
            {comparison.entries.length ? <button type="button" onClick={comparison.clear} className="text-text-dim hover:text-text">Clear all</button> : null}
          </div>
        </footer>
      </aside>
    </div>
  );
}
