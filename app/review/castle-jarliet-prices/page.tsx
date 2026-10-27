import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import delta from '@/data/pricing/dol266-approved-price-delta.json';
import { dol266PricePreviewEnabled } from '@/lib/catalog/dol266PricePreview';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Castle & Jarliet Price Review', robots: { index: false, follow: false } };
const usd = (v:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
export default function PriceReview() {
 if (!dol266PricePreviewEnabled()) notFound();
 return <main className="mx-auto max-w-7xl px-4 py-10 text-text sm:px-6">
  <h1 className="text-2xl font-semibold">Castle &amp; Jarliet Price Review</h1>
  <p className="mb-6 mt-2 text-sm text-text-dim">4 listings · 27 October 2026 · USD</p>
  <p className="mb-6 border-l-2 border-gold-400 pl-3 text-sm">Preview only. Live prices are unchanged. Checkout is unavailable. Freya remains on hold.</p>
  <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm">
   <thead><tr className="border-b border-border"><th className="py-3 pr-4">Product</th><th className="px-3 py-3 text-right">Current</th><th className="px-3 py-3 text-right">Proposed</th><th className="px-3 py-3">Review</th></tr></thead>
   <tbody>{delta.map(row=><tr key={row.id} className="border-b border-border align-top">
    <td className="min-w-48 py-3 pr-4">{row.handle.includes('jarliet')?'Jarliet Kate 148E':row.handle.includes('kirishima')?'Kirishima Eira 178P':row.handle.includes('luoyi')?'Luoyi 178P':'Lyla 178P'}</td>
    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{usd(row.before)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">{usd(row.after)}</td>
    <td className="px-3 py-3"><Link href={`/products/${row.handle}`} className="underline underline-offset-4">Product</Link></td>
   </tr>)}</tbody>
  </table></div>
 </main>;
}
