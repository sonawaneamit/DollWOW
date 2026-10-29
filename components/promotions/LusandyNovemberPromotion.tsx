'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import type { Product } from '@/types/product';
import { isLusandyNovemberActive, lusandyNovemberOfferForProduct, LUSANDY_NOVEMBER_OFFER as offer, LUSANDY_NOVEMBER_TIMING } from '@/lib/promotions/lusandyNovember2026';
import { useCampaignClock } from '@/lib/promotions/useCampaignClock';
import { isHalloweenInWindow } from '@/lib/promotions/halloween2026';

type Props = { promoClock: string; freezeClock?: boolean };
type PromotionProduct = Pick<Product, 'title' | 'handle' | 'vendor' | 'productType' | 'tags' | 'extended'>;

export function LusandyNovemberPdpPromotion({ product, ...props }: Props & { product: PromotionProduct }) {
  const clock = useCampaignClock(props.promoClock, props.freezeClock);
  return lusandyNovemberOfferForProduct(product, clock) ? <div className="mt-4"><FactoryOffer placement="pdp" stacking={isHalloweenInWindow(clock.getTime())} /></div> : null;
}

export function LusandyNovemberIndexCard(props: Props) {
  const clock = useCampaignClock(props.promoClock, props.freezeClock);
  return isLusandyNovemberActive(clock) ? <FactoryOffer placement="index" stacking={isHalloweenInWindow(clock.getTime())} /> : null;
}

function FactoryOffer({ placement, stacking }: { placement: 'pdp' | 'index'; stacking: boolean }) {
  const [open, setOpen] = useState(false);
  const detailsId = `${offer.id}-${placement}-details`;
  return <section id={placement === 'index' ? offer.id : undefined} data-lusandy-november="true" aria-label="Lusandy November factory promotion" className="overflow-hidden rounded-lg border border-border bg-surface text-text">
    <button type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen(value => !value)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
      <Image src={offer.image} alt="Lusandy official November promotion, 1-30 November 2026. Factory upgrades and standard options listed below." width={offer.width} height={offer.height} sizes="(min-width: 1024px) 55vw, 100vw" className="h-auto w-full object-contain" />
      <span className="flex min-h-12 items-center justify-between gap-3 border-t border-border px-4 py-3 text-base font-semibold"><span>Lusandy November offer - view details</span><ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} /></span>
    </button>
    <div id={detailsId} hidden={!open} className="border-t border-border px-5 py-5 sm:px-6">
      <p className="flex items-center gap-2 text-base font-semibold text-accent"><CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />{LUSANDY_NOVEMBER_TIMING.dateLabel}</p>
      <p className="mt-3 text-base leading-7 text-text-dim">Eligible custom full-size Lusandy silicone dolls. Ready-to-ship dolls, heads and body parts are excluded. Options remain subject to the model&apos;s factory compatibility.</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2"><OfferList title="Free factory upgrades" items={offer.included} /><OfferList title="Standard options included" items={offer.standard} /></div>
      {stacking ? <p className="mt-5 text-base leading-7 text-text-dim">Eligible factory bonuses remain included with HALLOWEEN299 through 8 November. The $299 code applies to eligible full-size dolls, not paid options or shipping.</p> : null}
    </div>
  </section>;
}

function OfferList({ title, items }: { title: string; items: readonly string[] }) {
  return <div><h3 className="text-lg font-semibold">{title}</h3><ul className="mt-3 grid gap-2">{items.map(item => <li key={item} className="flex gap-2 text-base leading-7 text-text-dim"><Check className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden="true" /><span>{item}</span></li>)}</ul></div>;
}
