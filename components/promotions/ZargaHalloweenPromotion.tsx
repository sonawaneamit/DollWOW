'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ZARGA_HANDLE } from '@/lib/catalog/zargaPreview';
import { isZargaHalloweenActive, ZARGA_HALLOWEEN, zargaHalloweenEndLabel } from '@/lib/promotions/zargaHalloween2026';

export function ZargaHalloweenPromotion({ enabled, variant = 'banner', promoClock }: {
  enabled: boolean; variant?: 'pill' | 'banner' | 'card'; promoClock: string;
}) {
  const [now, setNow] = useState(promoClock);
  useEffect(() => {
    const initial = Date.parse(promoClock);
    const mounted = Date.now();
    const timer = setInterval(() => setNow(new Date(initial + Date.now() - mounted).toISOString()), 1000);
    return () => clearInterval(timer);
  }, [promoClock]);
  if (!enabled || !isZargaHalloweenActive(new Date(now))) return null;
  const dates = `25 Oct - ${zargaHalloweenEndLabel()} 2026 (Portugal time)`;
  if (variant === 'pill') return <span data-zarga-promo="pill" className="rounded-full border border-gold-500/40 px-3 py-1 text-xs font-semibold text-gold-200">Free outfit + travel bag · Ends {zargaHalloweenEndLabel()}</span>;
  return <article id={variant === 'card' ? ZARGA_HALLOWEEN.id : undefined} data-zarga-promo={variant} className="overflow-hidden rounded-lg border border-gold-500/25">
    <Image src="/promo/climax-zarga-2026/banner.jpg" alt="Climax Zarga Halloween edition with the pictured outfit and travel bag" width={1920} height={1080} className="h-auto w-full" />
    <div className="space-y-2 p-4">
      <h2 className="text-xl font-semibold text-ivory-50">Zarga Halloween gifts</h2>
      <p className="text-sm text-ivory-200">The pictured outfit and travel bag are included with the Zarga 70cm Halloween edition during this offer.</p>
      <p className="text-sm text-gold-200">{dates}</p>
      <p className="text-sm text-ivory-200">This gift offer does not make Zarga eligible for HALLOWEEN299.</p>
      {variant === 'card' ? <Link href={`/products/${ZARGA_HANDLE}`} className="inline-block text-sm font-semibold text-gold-200 underline underline-offset-4">View Zarga</Link> : null}
    </div>
  </article>;
}
