"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useConsent, writeConsent } from "@/lib/analytics/consent";
import { useMounted } from "@/lib/utils/storageStore";
import type { HeadlessConsentConfig } from '@/lib/analytics/shopify-consent-bridge';
import { forwardExplicitShopifyConsent } from '@/lib/analytics/shopify-consent-client';
import { markShopifyConsentSynced } from '@/lib/analytics/shopify-consent-marker';

/**
 * GDPR/UK-style consent controls. GA4 stays in Consent Mode "denied" until the
 * visitor accepts; the choice is stored for 180 days. Kept visually discreet
 * and copy is privacy-first, matching the brand's discretion positioning.
 */
export function ConsentBanner({ shopifyConfig, autoPrompt = true }: { shopifyConfig?: HeadlessConsentConfig; autoPrompt?: boolean }) {
  const consent = useConsent();
  const mounted = useMounted();
  const [managing, setManaging] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const choiceGeneration = useRef(0);

  useEffect(() => {
    const openPreferences = () => { setDismissed(false); setStorageError(false); setManaging(true); };
    window.addEventListener("dollwow:manage-consent", openPreferences);
    return () => window.removeEventListener("dollwow:manage-consent", openPreferences);
  }, []);

  if (!mounted || (!managing && (!autoPrompt || dismissed || consent !== "unknown"))) return null;

  function choose(state: "granted" | "denied") {
    try {
      writeConsent(state);
    } catch {
      setStorageError(true);
      return;
    }
    setStorageError(false);
    setDismissed(true);
    setManaging(false);
    if (!shopifyConfig) return;

    // The local choice takes effect immediately. Checkout sync runs independently.
    const generation = ++choiceGeneration.current;
    void forwardExplicitShopifyConsent(state, shopifyConfig).then(result => {
      console.info('DollWOW privacy sync: ' + result);
      if (generation === choiceGeneration.current && result === 'registered') {
        markShopifyConsentSynced(state);
      }
    });
  }

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
              Allow optional analytics cookies to help us understand visits and improve DollWOW. You can change your choice at any time. <Link href="/privacy-policy">Learn more</Link>.
            </p>
            {storageError ? <p role="alert" className="consent-banner__copy">
              Your browser could not save this choice. Check your browser storage settings and try again.
            </p> : null}
          </div>
        </div>
        <div className="consent-banner__actions">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="consent-banner__button consent-banner__button--decline"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="consent-banner__button consent-banner__button--accept"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
