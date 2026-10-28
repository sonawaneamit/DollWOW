'use client';

import { useSyncExternalStore } from 'react';
import type { ConsentState } from './consent';

const KEY = 'dollwow-shopify-consent-v1';
const EVENT = 'dollwow:shopify-consent-synced';
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function readShopifyConsentMarker(): ConsentState {
  try {
    const record = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    const age = Date.now() - new Date(record?.at).getTime();
    if (!Number.isFinite(age) || age < 0 || age > MAX_AGE) return 'unknown';
    return record?.state === 'granted' || record?.state === 'denied' ? record.state : 'unknown';
  } catch { return 'unknown'; }
}

export function markShopifyConsentSynced(state: 'granted' | 'denied') {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ state, at: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch { /* Missing persistence means another prompt, never inferred permission. */ }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}

export function useShopifyConsentMarker() {
  return useSyncExternalStore(subscribe, readShopifyConsentMarker, () => 'unknown' as const);
}

export function needsShopifyConsentChoice(enabled: boolean, consent: ConsentState, synced: ConsentState) {
  return enabled && (consent === 'unknown' || synced !== consent);
}
