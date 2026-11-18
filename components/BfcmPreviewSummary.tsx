'use client';
import { useState } from 'react';
import { bfcmCalculatedCart, type BfcmPreview } from '@/lib/promotions/bfcmBrandPreview';
import type { SelectedCustomizationOption } from '@/types/customization';
const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
export function BfcmPreviewSummary({ offer, subtotal, selections }: { offer: BfcmPreview; subtotal: number; selections: SelectedCustomizationOption[] }) {
  const [showCart, setShowCart] = useState(false);
  const cart = bfcmCalculatedCart(subtotal);
  return <section className="my-5 rounded-md border border-border bg-surface-tint p-5" data-bfcm-breakdown>
    <h3 className="font-semibold">{offer.brand} Black Friday</h3>
    {offer.originalPrice > offer.price && <p><del>{usd(offer.originalPrice)}</del> <strong>{usd(offer.price)}</strong> · {usd(offer.originalPrice - offer.price)} off your doll</p>}
    <p className="mt-2 text-sm">Select your complimentary extras in the options menu. Take another $299 off orders of $900+ with <strong>BLACKFRIDAYWOW26</strong>.</p>
    <button type="button" onClick={() => setShowCart(!showCart)} className="mt-4 min-h-11 font-semibold text-accent underline">{showCart ? 'Close bag' : 'Review your bag'}</button>
    {showCart && <div data-bfcm-calculated-cart className="mt-4 border-t border-border pt-4">
      <ul>{selections.map(o => <li key={`${o.groupId}:${o.optionId}`} className="py-1 text-sm">{o.groupLabel}: {o.optionLabel} — {o.priceDelta === 0 ? 'Included' : usd(o.priceDelta)}</li>)}</ul>
      <p className="mt-3">Subtotal: {usd(cart.subtotal)}</p><p>BLACKFRIDAYWOW26: −{usd(cart.discount)}</p>
      <p className="mt-2 text-xl font-semibold">Total: {usd(cart.total)}</p>
    </div>}
  </section>;
}
