import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import rows from '@/data/draft-previews/gynoid-final-price-review.json';
import { gynoidPreviewEnabled, gynoidPreviewProducts } from '@/lib/catalog/gynoidPreview';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Gynoid Final Price Review',robots:{index:false,follow:false}};
const usd=(value:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);

export default function GynoidPriceReview(){
  if(!gynoidPreviewEnabled())notFound();
  const products=gynoidPreviewProducts();
  return <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
    <header className="space-y-3">
      <p className="text-sm font-semibold uppercase">Private price review · 29 October 2026</p>
      <h1 className="text-3xl font-semibold">Gynoid Final Prices</h1>
      <p>Eight model/version rows from the final proposal. Six unchanged; two Deluxe increases. Nothing applied to Shopify.</p>
      <p role="status" className="border-l-4 border-amber-600 pl-3 text-sm">Gynoid remains excluded from the sitewide 10% in this preview. Compare-at prices, options and promotions are unchanged. Live discount enforcement has not been changed.</p>
      <p className="text-sm">The saved collection has 11 draft listings plus one private candidate, not eight unique Shopify products. No separately mapped Deluxe draft or selector is established here. Deluxe rows are commercial price proposals only; no new doll, variant, feature or entitlement is inferred.</p>
      <Link href="/brands/gynoid-dolls" className="inline-block underline underline-offset-4">Review existing private collection</Link>
    </header>
    <div className="overflow-x-auto"><table className="w-full min-w-[610px] text-left text-sm">
      <caption className="sr-only">Final Gynoid model and version proposals in USD; no live changes</caption>
      <thead><tr className="border-b"><th className="p-3">Model / version</th><th className="p-3">Prior sheet price</th><th className="p-3">Final proposal</th><th className="p-3">Change</th></tr></thead>
      <tbody>{rows.map(row=>{
        const reference=products.find(p=>p.handle===row.referenceHandle);
        return <tr key={`${row.model}-${row.version}`} className="border-b align-top">
          <td className="p-3"><div className="flex gap-3">
            {reference?.featuredImage ? <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={reference.featuredImage.url} alt={`${row.model} existing family reference`} width={56} height={84} className="h-[84px] w-14 shrink-0 rounded object-cover"/>
            </> : null}
            <div><strong>{row.model} {row.version}</strong><p>{row.heightCm} cm</p>
              {reference?<Link className="underline" href={`/products/${reference.handle}`}>{reference.extended.displayName || reference.title} · Existing PDP</Link>:<p className="mt-1 text-xs">Price only · Exact Deluxe listing mapping pending</p>}
            </div></div></td>
          <td className="p-3 tabular-nums">{usd(row.priorUSD)}</td>
          <td className="p-3 font-semibold tabular-nums">{usd(row.proposedUSD)}</td>
          <td className="p-3 tabular-nums">{row.proposedUSD===row.priorUSD?'Unchanged':`+${usd(row.proposedUSD-row.priorUSD)}`}</td>
        </tr>;
      })}</tbody>
    </table></div>
  </section>;
}
