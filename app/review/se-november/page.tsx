import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import data from '@/data/promotion-previews/se-november-review.json';
import stockReview from '@/data/promotion-previews/se-november-stock-review.json';
import { isSeNovemberWindow, seNovemberReviewEnabled, SE_NOVEMBER_REVIEW_TERMS as terms, SE_NOVEMBER_TIMING as timing } from '@/lib/promotions/seNovember2026';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SEDOLL November Commercial Review', robots: { index: false, follow: false } };
const money = (value: number | string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
const phases = { before: new Date(Date.parse(timing.startsAt) - 1).toISOString(), november: '2026-11-02T12:00:00Z', expired: timing.endsAt };

export default async function SeNovemberReview({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  if (!seNovemberReviewEnabled()) notFound();
  const requested = (await searchParams).phase;
  const phase = requested === 'before' || requested === 'expired' ? requested : 'november';
  const active = isSeNovemberWindow(new Date(phases[phase]));
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <header className="space-y-3 border-b border-border pb-6">
      <p className="text-sm font-semibold uppercase">Private commercial review / Not released</p>
      <h1 className="text-3xl font-semibold">SEDOLL November</h1>
      <p>{timing.dateLabel} / {timing.timeZone} / USD</p>
      <p className="text-sm">Date-only supplier notice; this comparison uses the existing shop-time midnight convention, not a confirmed factory end-hour.</p>
      <p className="border-l-4 border-amber-600 pl-3 text-sm">Price and eligibility gates remain open. No live prices, menus, discounts or checkout changes. Exact landed margins and charge bindings are not verified.</p>
      <nav aria-label="Review date" className="flex flex-wrap gap-2">{(['before', 'november', 'expired'] as const).map(key => <a key={key} aria-current={key === phase ? 'page' : undefined} href={`?phase=${key}`} className={`inline-flex min-h-11 items-center border px-4 text-sm ${key === phase ? 'border-accent font-semibold text-accent' : 'border-border'}`}>{key === 'before' ? 'Before November' : key === 'november' ? 'November' : 'After November'}</a>)}</nav>
      <p role="status" className="font-medium">Campaign window: {active ? 'In range' : 'Out of range'} <span className="text-sm font-normal">({phases[phase]})</span></p>
    </header>
    <section className="border-b border-border py-6">
      <h2 className="text-xl font-semibold">Four Supplier Offer Groups</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div><h3 className="font-semibold">TPE Custom</h3><p className="mt-2 text-sm">Included: {terms.tpeCustom.included.join(', ')}.</p><p className="mt-2 text-sm">50% off second TPE head and custom skin tone. 10% off LSTPE only for 157H, 161F and 163E. Existing head-menu and construction restrictions remain.</p></div>
        <div><h3 className="font-semibold">Silicone Pro Custom</h3><p className="mt-2 text-sm">Included: {terms.siliconeProCustom.included.join(', ')}.</p><p className="mt-2 text-sm">Soft belly only for {terms.siliconeProCustom.softBellyBodies.join(', ')}. 10% off master makeup; 50% off gel butt. A random supplier head is not a free choice from the named paid-head menu.</p></div>
        <div><h3 className="font-semibold">Silicone Torso Custom</h3><p className="mt-2 text-sm">Included soft belly: {terms.siliconeTorsoCustom.softBellyBodies.join(', ')}. 50% off gel butt: {terms.siliconeTorsoCustom.gelButtBodies.join(', ')}. 50% off second silicone head. ST2-long is not treated as ST2 without exact evidence.</p></div>
        <div><h3 className="font-semibold">US / EU Stock</h3><ul className="mt-2 space-y-1 text-sm">{terms.warehouse.map(row => <li key={`${row.region}-${row.material}`}>{row.region} {row.material}: {row.suggestedMinimumRetailReductionPercent}% suggested retail reduction{row.included.length ? ' + realistic skin texture' : ''}.</li>)}</ul><p className="mt-2 text-sm">Regional material/version and supplier stock prices require reconciliation. No automatic stock reprice or global delivery promise.</p></div>
      </div>
    </section>
    <section className="border-b border-border py-6"><h2 className="text-xl font-semibold">Catalog Evidence</h2><p className="mt-2 text-sm">Read {data.sourceAt}: {data.counts['tpe-custom']} TPE custom, {data.counts['silicone-pro-custom']} reviewed Silicone Pro custom, {data.counts['silicone-torso-custom']} torso candidates, {data.counts.warehouse} warehouse candidates and {data.counts.held} unmatched record. These are mapping counts, not release approvals. Body-specific benefits do not use height proxies.</p></section>
    <section className="py-6"><h2 className="text-xl font-semibold">Exact Menu Comparisons</h2><p className="mt-2 text-sm">Catalog deltas versus supplier-offer proposals, not current October checkout totals. Missing prices remain unknown; no paid head, combined option or conditional group inherits a discount by name alone.</p>
      {data.samples.map(sample => <article key={sample.handle} className="grid gap-5 border-b border-border py-6 sm:grid-cols-[120px_minmax(0,1fr)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sample.image.url} alt={sample.image.altText ?? sample.title} width={sample.image.width} height={sample.image.height} className="h-[180px] w-[120px] object-contain" />
        <div className="min-w-0"><h3 className="font-semibold">{sample.title}</h3><p className="mt-1 text-sm">Base catalog retail: {money(sample.baseRetail)} / {sample.cohort}</p>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[430px] text-left text-sm"><caption className="sr-only">{sample.title} option comparisons</caption><thead><tr className="border-b border-border"><th className="p-2">Option</th><th className="p-2">Catalog delta</th><th className="p-2">{active ? 'November proposal' : 'Outside window'}</th></tr></thead><tbody>{sample.quotes.map(row => <tr key={`${row.groupId}-${row.optionId}`} className="border-b border-border"><th className="p-2 font-normal">{row.label}</th><td className="p-2 tabular-nums">{money(row.current)}</td><td className="p-2 tabular-nums">{money(active ? row.proposed : row.current)}</td></tr>)}</tbody></table></div>
        </div>
      </article>)}
    </section>
    <section className="border-t border-border py-6">
      <h2 className="text-xl font-semibold">EU Stock Price Scenario</h2>
      <p className="mt-2 text-sm">Current store prices read {stockReview.sourceAt}. The 10% customer reduction below is a draft calculation, not an available offer. Factory configuration and overlapping discounts still need checking; no stock quantity or delivery promise.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Draft EU retail prices and exact original-price restoration</caption>
        <thead><tr className="border-b border-border"><th className="p-2">Listing</th><th className="p-2">Original</th><th className="p-2">{active ? 'Draft 10% reduction' : 'Outside window'}</th><th className="p-2">Restore after 7 Dec</th><th className="p-2">Check</th></tr></thead>
        <tbody>{stockReview.rows.map(row => <tr key={row.handle} className="border-b border-border">
          <th className="p-2 font-normal"><a href={`https://dollwow.com/products/${row.handle}`} className="underline">{row.title}</a></th>
          <td className="p-2 tabular-nums">{money(row.baselineCents / 100)}</td>
          <td className="p-2 tabular-nums">{money((active ? row.proposedCents : row.baselineCents) / 100)}</td>
          <td className="p-2 tabular-nums">{money(row.restoreCents / 100)}</td>
          <td className="p-2">{row.identityCheck}</td>
        </tr>)}</tbody>
      </table></div>
      <p className="mt-3 text-sm">Restoration returns to each exact original amount, not the discounted amount plus 10%. This preview has no scheduled write configured. Supplier prices and dealer discounts are separate from these store-price calculations.</p>
    </section>
    <section className="border-t border-border py-6"><h2 className="text-xl font-semibold">Other Warehouse Evidence</h2><p className="mt-2 text-sm">The retained seven-listing snapshot below is dated {data.sourceAt}, not a new physical-stock check. Generic Silicone alone does not prove Silicone Pro; partial/torso stock must not inherit full-body terms.</p><ul className="mt-4 divide-y divide-border">{data.stock.map(row => <li key={row.handle} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="max-w-2xl">{row.title} / {row.warehouseCountry}</span><span className="tabular-nums">{money(row.baseRetail)} / Unchanged</span></li>)}</ul></section>
    <footer className="border-t border-border py-6 text-sm">Review outstanding: exact supplier option costs and landed margin, body/version exceptions, additional-head delivery mapping and server-side named charges. No purchase controls. Dolly review, then exact preview approval from Martin before release.</footer>
  </main>;
}
