'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useConsent } from '@/lib/analytics/consent';
import { useMounted } from '@/lib/utils/storageStore';

function subscribeScript(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.head, { childList: true });
  return () => observer.disconnect();
}

export function AnalyticsProbe() {
  const consent = useConsent();
  const [commands, setCommands] = useState<string[]>([]);
  const mounted = useMounted();
  const testMode = mounted && window.dollwowAnalytics?.mode === 'test';
  const scriptPresent = useSyncExternalStore(subscribeScript,
    () => !!document.getElementById('dollwow-ga-loader'), () => false);

  useEffect(() => {
    if (window.dollwowAnalytics?.mode !== 'test') return;
    const original = window.gtag;
    const wrapper = (...args: unknown[]) => {
      original?.(...args);
      // Fixed labels only: never display client/session IDs or event payloads.
      const label = args[0] === 'consent' ? 'Consent update queued'
        : args[0] === 'event' && args[1] === 'page_view' ? 'Page view queued' : null;
      if (label) setCommands(previous => [...previous.slice(-19), label]);
    };
    window.gtag = wrapper;
    return () => {
      if (window.gtag === wrapper) window.gtag = original;
    };
  }, []);

  return <section style={{ maxWidth: 860, margin: '40px auto', padding: 24 }}>
    <h1 style={{ fontSize: 28 }}>Analytics QA</h1>
    <dl style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, margin: '24px 0' }}>
      <dt>Stream</dt><dd>{testMode ? 'QA only' : 'Disabled'}</dd>
      <dt>Consent</dt><dd>{consent}</dd>
      <dt>Google script</dt><dd>{scriptPresent ? 'Element present; delivery unverified' : 'Not mounted'}</dd>
      <dt>Page views queued</dt><dd>{commands.filter(command => command === 'Page view queued').length}</dd>
      <dt>Shopify handoff</dt><dd>Not wired</dd>
      <dt>Purchase delivery</dt><dd>Not tested</dd>
    </dl>
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 24, margin: '24px 0' }}>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('dollwow:manage-consent'))}>Privacy preferences</button>
      <Link href="/review/analytics/a">Page A</Link>
      <Link href="/review/analytics/b">Page B</Link>
    </nav>
    <h2 style={{ fontSize: 18 }}>Queue Observations</h2>
    <ol aria-label="Queue observations">{commands.map((command, index) => <li key={index}>{command}</li>)}</ol>
  </section>;
}
