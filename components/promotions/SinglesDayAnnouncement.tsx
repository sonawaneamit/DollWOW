'use client';

import Link from 'next/link';
import { useSinglesDayCampaign } from './SinglesDayHero';

export function SinglesDayAnnouncement() {
  const active = useSinglesDayCampaign();
  return <div className={`announcement-bar sticky top-0 z-[81] h-[36px] flex items-center justify-center border-b px-2 ${active ? 'bg-[#641e29] text-[#fff3df] border-[#8e3946]' : 'bg-surface text-text border-border'}`}>
    <p className={`text-[13px] text-center leading-[16px] ${active ? 'font-semibold' : 'text-text-dim'}`}>
      <Link href={active ? '/shop/sex-dolls' : '/promo'} data-singles-day-announcement={active || undefined}>
        {active ? '🎉 Singles Day: $299 OFF full-size dolls. Stacks with brand promos! 🎊' : 'Explore our latest offers and factory bonuses'}
      </Link>
    </p>
  </div>;
}
