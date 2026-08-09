"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!mounted || consent !== "unknown") return;

    const revealAfterScroll = () => {
      if (window.scrollY < 120) return;
      setRevealed(true);
      window.removeEventListener("scroll", revealAfterScroll);
    };

    revealAfterScroll();
    window.addEventListener("scroll", revealAfterScroll, { passive: true });
    return () => window.removeEventListener("scroll", revealAfterScroll);
  }, [consent, mounted]);

  if (!mounted || consent !== "unknown" || !revealed) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy preferences"
      className="consent-banner"
    >
      <div className="consent-banner__inner">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-300/10 text-gold-300">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="consent-banner__title">Your privacy, your choice</p>
            <p className="consent-banner__copy">
              Privacy-safe analytics help us improve DollWow. We do not share your browsing with advertisers. <Link href="/privacy-policy">Learn more</Link>.
            </p>
          </div>
        </div>
        <div className="consent-banner__actions">
          <button
            type="button"
            onClick={() => writeConsent("denied")}
            className="consent-banner__button consent-banner__button--decline"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => writeConsent("granted")}
            className="consent-banner__button consent-banner__button--accept"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
