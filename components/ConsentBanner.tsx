"use client";

import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useConsent, writeConsent } from "@/lib/analytics/consent";
import { useMounted } from "@/lib/utils/storageStore";
import type { HeadlessConsentConfig } from '@/lib/analytics/shopify-consent-bridge';
import { forwardExplicitShopifyConsent } from '@/lib/analytics/shopify-consent-client';
import { markShopifyConsentSynced, needsShopifyConsentChoice, useShopifyConsentMarker } from '@/lib/analytics/shopify-consent-marker';

/**
 * GDPR/UK-style consent controls. GA4 stays in Consent Mode "denied" until the
 * visitor accepts; the choice is stored for 180 days. Kept visually discreet
 * and copy is privacy-first, matching the brand's discretion positioning.
 */
export function ConsentBanner({ shopifyConfig, autoPrompt = true }: { shopifyConfig?: HeadlessConsentConfig; autoPrompt?: boolean }) {
  const consent = useConsent();
  const syncedConsent = useShopifyConsentMarker();
  const needsCheckoutChoice = needsShopifyConsentChoice(!!shopifyConfig, consent, syncedConsent);
  const mounted = useMounted();
  const [revealed, setRevealed] = useState(false);
  const [managing, setManaging] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'failed'>('idle');
  const choiceGeneration = useRef(0);

  useEffect(() => {
    const openPreferences = () => { setDismissed(false); setManaging(true); };
    window.addEventListener("dollwow:manage-consent", openPreferences);
    return () => window.removeEventListener("dollwow:manage-consent", openPreferences);
  }, []);

  useEffect(() => {
    if (!autoPrompt || !mounted || dismissed || (consent !== "unknown" && !needsCheckoutChoice)) return;

    const revealAfterScroll = () => {
      if (window.scrollY < 120) return;
      setRevealed(true);
      window.removeEventListener("scroll", revealAfterScroll);
    };

    revealAfterScroll();
    window.addEventListener("scroll", revealAfterScroll, { passive: true });
    return () => window.removeEventListener("scroll", revealAfterScroll);
  }, [autoPrompt, consent, mounted, needsCheckoutChoice, dismissed]);

  if (!mounted || (!managing && (!autoPrompt || dismissed || (consent !== "unknown" && !needsCheckoutChoice) || !revealed))) return null;

  function choose(state: "granted" | "denied") {
    setDismissed(false);
    writeConsent(state);
    if (!shopifyConfig) { setManaging(false); return; }
    const generation = ++choiceGeneration.current;
    setManaging(true);
    setSyncStatus('pending');
    const timeout = setTimeout(() => {
      if (generation === choiceGeneration.current) setSyncStatus('failed');
    }, 15000);
    void forwardExplicitShopifyConsent(state, shopifyConfig).then(result => {
      clearTimeout(timeout);
      console.info('DollWOW privacy sync: ' + result);
      if (generation !== choiceGeneration.current) return;
      if (result === 'registered') { markShopifyConsentSynced(state); setSyncStatus('idle'); setManaging(false); }
      else setSyncStatus('failed');
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
              Privacy-safe analytics help us improve DollWow. We do not share your browsing with advertisers. <Link href="/privacy-policy">Learn more</Link>.
            </p>
            {needsCheckoutChoice && consent !== 'unknown' && syncStatus === 'idle' ?
              <p className="consent-banner__copy">Please confirm your privacy choice for checkout.</p> : null}
            {syncStatus !== 'idle' ? <p role="status" className="consent-banner__copy">
              {syncStatus === 'pending' ? 'Saving your checkout privacy choice...' : 'Your site privacy choice is saved. Checkout sync could not be verified. Please try again.'}
            </p> : null}
          </div>
        </div>
        <div className="consent-banner__actions">
          {syncStatus === 'failed' ? <button type="button" aria-label="Close privacy preferences" title="Close privacy preferences"
            onClick={() => { setDismissed(true); setManaging(false); }}
            className="consent-banner__button consent-banner__button--decline">
            <X size={18} aria-hidden="true" />
          </button> : null}
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
