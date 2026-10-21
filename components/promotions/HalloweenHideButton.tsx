"use client";
import { EyeOff } from "lucide-react";
import { HALLOWEEN_2026 } from "@/lib/promotions/halloween2026";

export function HalloweenHideButton() {
  return <button type="button" title="Hide spiders" aria-label="Hide spiders" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px]" onClick={() => {
    try { localStorage.setItem(HALLOWEEN_2026.dismissalKey, "1"); } catch { /* The in-page event still dismisses this visit. */ }
    window.dispatchEvent(new Event("dollwow:halloween-hide"));
  }}><EyeOff size={17} aria-hidden="true" /></button>;
}
