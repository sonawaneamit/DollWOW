import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import manifest from '@/data/pricing/dol276-funwest-preview.json';
import { funwestPricePreviewEnabled } from '@/lib/catalog/funwestPricePreview';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'FunWest Pricing Review', robots: { index: false, follow: false } };
const usd = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export default function FunwestPriceReview() {
  if (!funwestPricePreviewEnabled()) notFound();
  return <main className="mx-auto max-w-7xl px-4 py-10 text-text sm:px-6">
    <h1 className="text-2xl font-semibold">FunWest Pricing Review</h1>
    <p className="mb-6 mt-2 text-sm text-text-dim">164 listings · Greenback v4 · 27 October 2026 · USD · Awaiting Martin approval</p>
    <p className="mb-6 border-l-2 border-gold-400 pl-3 text-sm">Preview only. Live prices are unchanged. Checkout is unavailable.</p>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead><tr className="border-b border-white/20"><th className="py-3 pr-4">Product</th><th className="px-3 py-3 text-right">Current</th><th className="px-3 py-3 text-right">Proposed</th><th className="px-3 py-3 text-right">Increase</th><th className="px-3 py-3">Review</th></tr></thead>
        <tbody>{manifest.map(row => <tr key={row.id} className="border-b border-white/10 align-top">
          <td className="min-w-48 py-3 pr-4">{row.title}</td>
          <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{usd(row.before)}</td>
          <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">{usd(row.after)}</td>
          <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">+{usd(row.after - row.before)}</td>
          <td className="px-3 py-3"><Link className="underline underline-offset-4" href={`/products/${row.handle}`}>Product</Link></td>
        </tr>)}</tbody>
      </table>
    </div>
  </main>;
}
