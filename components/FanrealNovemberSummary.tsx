'use client';
import { useState } from 'react';
import { fanrealNovemberCart, type FanrealNovemberPreview } from '@/lib/promotions/fanrealNovember2026';
import type { SelectedCustomizationOption } from '@/types/customization';

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export function FanrealNovemberSummary({ offer, subtotal, selections }: { offer: FanrealNovemberPreview; subtotal: number; selections: SelectedCustomizationOption[] }) {
  const [showCart, setShowCart] = useState(false);
  const cart = fanrealNovemberCart(subtotal);
  return (
    <section className="my-5 rounded-md border border-border bg-surface-tint p-5" data-fanreal-november-breakdown>
      <h3 className="font-semibold">Fanreal November deal</h3>
      {offer.cashOff > 0 ? (
        <p>
          <del>{usd(offer.originalPrice)}</del> <strong>{usd(offer.price)}</strong> · {usd(offer.cashOff)} off your doll
        </p>
      ) : offer.kind === 'custom' ? (
        <p>Free custom extras are included in the options below.</p>
      ) : (
        <p>This in-stock doll keeps its current page price. The $299 code below still stacks.</p>
      )}
      {offer.kind === 'custom' ? <p className="mt-2 text-sm">Select your complimentary extras in the options menu.</p> : null}
      <p className="mt-2 text-sm">Take another $299 off orders of $900+ with <strong>BLACKFRIDAYWOW26</strong>. Ends 30 November 2026.</p>
      <button type="button" onClick={() => setShowCart(!showCart)} className="mt-4 min-h-11 font-semibold text-accent underline">{showCart ? 'Close bag' : 'Review your bag'}</button>
      {showCart && (
        <div data-fanreal-november-calculated-cart className="mt-4 border-t border-border pt-4">
          <ul>{selections.map((o) => <li key={`${o.groupId}:${o.optionId}`} className="py-1 text-sm">{o.groupLabel}: {o.optionLabel} — {o.priceDelta === 0 ? 'Included' : usd(o.priceDelta)}</li>)}</ul>
          <p className="mt-3">Subtotal: {usd(cart.subtotal)}</p>
          <p>BLACKFRIDAYWOW26: −{usd(cart.discount)}</p>
          <p className="mt-2 text-xl font-semibold">Total: {usd(cart.total)}</p>
        </div>
      )}
    </section>
  );
}
