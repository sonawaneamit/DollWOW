"use client";
import { Gift } from "lucide-react";

export function HalloweenOfferButton() {
  return <button type="button" title="Show Halloween offer" aria-label="Show Halloween offer" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px]" onClick={() => window.dispatchEvent(new Event("dollwow:halloween-reveal"))}><Gift size={17} aria-hidden="true" /></button>;
}
