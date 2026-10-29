import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import rows from '@/data/price-previews/fanreal-landed.json';
import { fanrealPriceReviewEnabled } from '@/lib/catalog/landed-price-preview';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Fanreal Price Review',robots:{index:false,follow:false}};
const usd=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);

export default function FanrealPriceReview(){
  if(!fanrealPriceReviewEnabled())notFound();
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
    <header className="space-y-2"><p className="text-sm font-semibold uppercase">Private review · Not applied</p>
      <h1 className="text-3xl font-semibold">Fanreal Prices</h1>
      <p>Eight custom listings with the approved US-air allowance. Two US-stock prices unchanged.</p>
      <p className="text-sm">30% product-and-air gross margin basis, not net profit. Duties, tax, payment fees and paid options are not verified here. The $299 column is conditional, not a new discount or proof of eligibility.</p>
      <p role="status" className="border-l-4 border-amber-600 pl-3 text-sm">No live price changes. Certificate received; original attachment retrieval is unfinished. Product-price approval and campaign eligibility checks remain open.</p>
    </header>
    <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
      <caption className="sr-only">Current retail and alternative review prices in USD</caption>
      <thead><tr className="border-b"><th className="p-3">Listing</th><th className="p-3">Current</th><th className="p-3">30% before discounts</th><th className="p-3">30% if $299 applies</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id} className="border-b align-top">
        <td className="p-3"><div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.image} alt={row.title} width={56} height={84} className="h-[84px] w-14 shrink-0 rounded object-cover"/>
          <div className="max-w-64"><a className="underline" href={`https://dollwow.com/products/${row.handle}`}>{row.title}</a><p className="mt-1 text-xs">{row.inStock?'US stock · Keep current retail':row.torso?'Custom torso · Discount eligibility unverified':'Custom Real Skin · Discount eligibility unverified'}</p></div>
        </div></td>
        <td className="p-3 tabular-nums">{usd(row.currentUSD)}</td><td className="p-3 tabular-nums">{usd(row.undiscountedMinimumUSD)}</td><td className="p-3 tabular-nums">{row.inStock?'Unchanged':usd(row.if299AppliesUSD)}</td>
      </tr>)}</tbody>
    </table></div>
  </main>;
}
