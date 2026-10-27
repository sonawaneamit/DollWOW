'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isSeHalloweenActive, seHalloweenEndLabel, SE_HALLOWEEN_2026 } from '@/lib/promotions/seHalloween2026';

export function SeHalloweenPromotion({ enabled, initialClock }: { enabled: boolean; initialClock: string }) {
  const [now, setNow] = useState(Date.parse(initialClock));
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);
  if (!enabled || !isSeHalloweenActive(now)) return null;
  return <section id={SE_HALLOWEEN_2026.id} className="my-6 border-y border-border py-5" aria-labelledby="se-halloween-heading" data-se-halloween>
    <h2 id="se-halloween-heading" className="text-xl font-semibold">SE Doll Halloween offers</h2>
    <p className="mt-2 text-sm text-text-dim">Through {seHalloweenEndLabel()}. Eligible SE custom-order bonuses combine with HALLOWEEN299 on qualifying full-size dolls. Your selected body and head determine the available upgrades.</p>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {(['crimson', 'dark'] as const).map(kind => <picture key={kind}>
        <source media="(max-width: 767px)" srcSet={`/promo/se-halloween-2026/${kind}-mobile.jpg`} width="900" height="1200" />
        {/* Supplier artwork is preserved at its original aspect ratio. */}
        <img src={`/promo/se-halloween-2026/${kind}-desktop.jpg`} alt={kind === 'crimson' ? 'SE Doll Crimson Flame Halloween artwork with red-skinned adult dolls.' : 'SE Doll Dark Temptation Halloween artwork with dark-skinned adult Elf dolls.'} width="1200" height="900" className="h-auto w-full rounded-lg" loading="lazy" />
      </picture>)}
    </div>
    <Link href="/brands/se-doll" className="mt-4 inline-block text-sm font-semibold text-accent underline">Browse SE Doll</Link>
  </section>;
}
