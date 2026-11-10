'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isSinglesDayActive, SINGLES_DAY_2026 } from '@/lib/promotions/singlesDay2026';
import './singles-day.css';

export function useSinglesDayCampaign(initialActive = false) {
  const [active, setActive] = useState(initialActive);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = Date.now();
      setActive(isSinglesDayActive(now));
      const boundary = [SINGLES_DAY_2026.startsAt, SINGLES_DAY_2026.endsAt]
        .map(Date.parse).find(time => time > now);
      if (boundary) timer = setTimeout(refresh, Math.min(boundary - now + 10, 2_147_000_000));
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return active;
}

export function SinglesDayHero() {
  return <section className="singles-day-hero" aria-labelledby="singles-day-title" data-singles-day-hero>
    <picture>
      <source media="(max-width: 640px)" srcSet="/images/promotions/singles-day-2026/ria-v4-960.jpg" />
      <source media="(max-width: 1280px)" srcSet="/images/promotions/singles-day-2026/ria-v4-1280.jpg" />
      {/* Exact approved artwork, resized without crops, retouching or regenerated copy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/promotions/singles-day-2026/ria-v4-2048.jpg" width="2048" height="1152"
        alt="Ria in a navy evening dress in the approved DollWOW Singles Day editorial artwork." fetchPriority="high" />
    </picture>
    <div className="singles-day-hero__details">
      <div><h1 id="singles-day-title">$299 off full-size dolls</h1>
        <p>Ready to ship + custom. Stacks with eligible brand promotions.</p>
        <p className="singles-day-hero__terms">From 11 Nov until early Black Friday. Excludes torsos, hips, minis and add-ons. Applied automatically at checkout.</p></div>
      <div className="singles-day-hero__actions">
        <Link href="/shop/sex-dolls">Shop dolls</Link>
        <Link href="/shop/ready-to-ship">Ready to ship</Link>
      </div>
    </div>
  </section>;
}
