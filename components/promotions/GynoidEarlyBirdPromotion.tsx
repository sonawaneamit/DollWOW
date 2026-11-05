'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GYNOID_EARLY_BIRD as offer, gynoidEarlyBirdTier } from '@/lib/promotions/gynoidEarlyBird2026';
import { useCampaignClock } from '@/lib/promotions/useCampaignClock';

export function GynoidEarlyBirdPromotion({ promoClock, freezeClock = false }: { promoClock: string; freezeClock?: boolean }) {
  const clock = useCampaignClock(promoClock, freezeClock);
  const tier = gynoidEarlyBirdTier(clock);
  if (!tier) return null;
  return <section id={offer.id} aria-labelledby="gynoid-early-bird-heading" className="my-6 overflow-hidden rounded-lg border border-border bg-surface text-text">
    <div className="grid md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <Image src="/promo/gynoid-early-bird-2026/official.jpg" alt="Gynoid supplier campaign photograph" width={2560} height={3840} sizes="(min-width: 768px) 35vw, 100vw" className="h-64 w-full object-cover object-[center_24%] md:h-full md:max-h-[560px]" />
      <div className="min-w-0 p-5 sm:p-8">
        <p className="text-sm font-semibold text-accent">{offer.dateLabel}</p>
        <h2 id="gynoid-early-bird-heading" className="mt-2 text-3xl font-semibold">Gynoid Early Bird Sale</h2>
        <p className="mt-4 text-xl font-semibold">${tier.saving} USD off eligible head + body builds</p>
        <p className="mt-3 text-base leading-7 text-text-dim">Choose any head with the new M25 body, or pair Lyra with another eligible body. The saving steps down as the sale continues.</p>
        <dl className="mt-5 grid gap-2 sm:grid-cols-3">{offer.tiers.map(item => <div key={item.start} aria-current={tier.start === item.start ? 'date' : undefined} className={`rounded-lg border p-3 ${tier.start === item.start ? 'border-accent bg-surface-tint' : 'border-border'}`}>
          <dt className="text-sm leading-6">{item.dates}</dt><dd className="mt-1 text-lg font-semibold">${item.saving} off</dd>
        </div>)}</dl>
        <details className="mt-5 border-t border-border pt-4">
          <summary className="cursor-pointer text-base font-semibold focus-visible:outline-accent">Eligible builds and head offer</summary>
          <div className="mt-3 space-y-3 text-base leading-7 text-text-dim">
            <p>M25 Standard and Deluxe builds qualify with any head. Other bodies qualify when paired with Lyra. The No. 17 torso is excluded.</p>
            <p>Lyra single heads: $150 USD off throughout the campaign, with a free head display holder. Rooted eyebrows and rooted hair carry the applicable head upgrade cost.</p>
            <p>Offers apply to these combinations only. Other Gynoid listings keep their listed prices. Contact us to confirm your combination, final price and shipping before ordering.</p>
          </div>
        </details>
        <Link href="/support" className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-accent px-5 py-3 font-semibold text-black">Ask about an Early Bird build</Link>
      </div>
    </div>
  </section>;
}
