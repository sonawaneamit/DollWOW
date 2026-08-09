"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useConsent, writeConsent } from "@/lib/analytics/consent";
import { useMounted } from "@/lib/utils/storageStore";

/**
 * GDPR/UK-style consent controls. GA4 stays in Consent Mode "denied" until the
 * visitor accepts; the choice is stored for 180 days. Kept visually discreet
 * and copy is privacy-first, matching the brand's discretion positioning.
 */
export function ConsentBanner() {
  const consent = useConsent();
  const mounted = useMounted();

  if (!mounted || consent !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy preferences"
      className="fixed inset-x-0 bottom-0 z-[95] border-t border-gold-500/20 bg-ink-950/97 px-4 py-4 shadow-soft sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-300/10 text-gold-300">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ivory-100">Your privacy, your choice</p>
            <p className="mt-1 max-w-xl text-sm leading-5 text-ivory-400">
              We use privacy-safe analytics to improve the store. Nothing is shared with advertisers, and your browsing here
              stays discreet. Read our <Link href="/privacy-policy" className="text-gold-300 underline-offset-2 hover:underline">privacy policy</Link>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => writeConsent("denied")}
            className="rounded-full border border-gold-500/24 px-4 py-2 text-sm font-semibold  text-ivory-300 transition hover:border-gold-300/50 hover:text-ivory-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => writeConsent("granted")}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold  text-white shadow-glow transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
