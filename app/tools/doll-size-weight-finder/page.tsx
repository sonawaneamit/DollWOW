import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Ruler } from 'lucide-react';
import { getSizeWeightSnapshot } from '@/lib/catalog/sizeWeightSnapshot';
import { finderHeight, finderMaterials, finderSummary, finderWeight, type FinderMaterial } from '@/lib/catalog/sizeWeightFinder';

type Params = Record<string, string | string[] | undefined>;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: 'Doll Size & Weight Finder',
    description: 'Compare observed listed weights for full dolls 140cm and taller by height and material, with missing data and body-only weights shown separately.',
    alternates: { canonical: '/tools/doll-size-weight-finder' },
    robots: { index: Object.keys(params).length === 0, follow: true },
  };
}

export default async function SizeWeightFinder({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  let catalog;
  try {
    catalog = await getSizeWeightSnapshot();
    if (!Number.isFinite(Date.parse(catalog.checkedAt)) || Date.now() - Date.parse(catalog.checkedAt) > 86400000) throw new Error('Catalog snapshot expired');
  } catch {
    return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><h1 className="text-3xl font-semibold">Doll Size &amp; Weight Finder</h1><p className="mt-4">Current listing data is temporarily unavailable. No estimated weights are shown.</p><Link className="mt-4 inline-block underline" href="/learn/sex-doll-size-weight-guide">Read the size and weight guide</Link></section>;
  }
  const heights = [...new Set(catalog.rows.map(row => row.heightCm))].sort((a, b) => a - b);
  const requestedHeight = typeof params.height === 'string' ? Number(params.height) : 165;
  const height = heights.includes(requestedHeight) ? requestedHeight : heights.includes(165) ? 165 : heights[0];
  const material = finderMaterials.some(option => option.value === params.material) ? params.material as FinderMaterial : 'tpe';
  const summary = finderSummary(catalog.rows, height, material);
  const pageCount = Math.max(1, Math.ceil(summary.matches.length / 24));
  const requestedPage = typeof params.page === 'string' ? Number(params.page) : 1;
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= pageCount ? requestedPage : 1;
  const visibleMatches = summary.matches.slice((page - 1) * 24, page * 24);
  const pageHref = (value: number) => `/tools/doll-size-weight-finder?${new URLSearchParams({ height: String(height), material, page: String(value) })}`;
  const checked = catalog.checkedAt;
  const basisLabel = (basis: string) => basis === 'factory-body-only' ? 'Factory body only' : 'Listed weight: basis unspecified';
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3 text-accent"><Ruler className="h-6 w-6" aria-hidden="true" /><p className="text-sm">Size &amp; Weight</p></div>
      <h1 className="mt-3 text-3xl font-semibold text-text sm:text-4xl">Doll Size &amp; Weight Finder</h1>
      <p className="mt-4 max-w-3xl leading-7 text-text-dim">Height alone does not determine weight. Compare observed listing weights for full dolls 140 cm and taller. Body-only weights stay separate; missing weights are never estimated.</p>
      <form action="/tools/doll-size-weight-finder" method="get" className="mt-6 grid items-end gap-4 border-y border-border py-5 sm:grid-cols-[1fr_1fr_auto]">
        <div className="min-w-0"><label htmlFor="finder-height" className="text-sm font-medium">Height</label><select id="finder-height" name="height" defaultValue={height} className="mt-2 block min-h-12 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base">{heights.map(cm => <option key={cm} value={cm}>{finderHeight(cm)}</option>)}</select></div>
        <div className="min-w-0"><label htmlFor="finder-material" className="text-sm font-medium">Material label</label><select id="finder-material" name="material" defaultValue={material} className="mt-2 block min-h-12 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-base">{finderMaterials.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 font-semibold text-white" type="submit">Find weights<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
      </form>
      <section className="py-6" aria-labelledby="finder-result">
        <h2 id="finder-result" className="text-xl font-semibold">{height ? finderHeight(height) : 'No heights available'} · {finderMaterials.find(option => option.value === material)!.label}</h2>
        <p className="mt-2 text-sm text-text-dim">{summary.matches.length} matching listings · {summary.matches.length - summary.missing} with a listed weight · {summary.missing} missing weight</p>
        {summary.ranges.map(range => <div key={range.basis} className="mt-5 border-l-2 border-accent pl-4"><h3 className="font-semibold">{basisLabel(range.basis)}</h3><p className="mt-1 text-lg">{range.minLb === null ? 'No recorded weights in this group' : range.minLb === range.maxLb ? finderWeight(range.minLb) : `${finderWeight(range.minLb)} to ${finderWeight(range.maxLb!)}`}</p><p className="mt-1 text-sm text-text-dim">{range.count} listings. {range.basis === 'factory-body-only' ? 'Recorded body mass only. Head inclusion and shipping mass are not established.' : 'The generic listing weight does not establish net, body-only or packed shipping mass. Confirm the selected configuration before ordering.'}</p></div>)}
        {!summary.matches.length && <p className="mt-5">No matching listings in this data. Choose another height or material; we do not interpolate weights.</p>}
      </section>
      {!!summary.matches.length && <section className="border-t border-border py-6" aria-labelledby="finder-matches"><h2 id="finder-matches" className="text-xl font-semibold">Matching listings</h2><p className="mt-2 text-sm text-text-dim">Showing {(page - 1) * 24 + 1}–{Math.min(page * 24, summary.matches.length)} of {summary.matches.length}</p><ul className="mt-4 divide-y divide-border">{visibleMatches.map(row => <li key={row.id} className="py-3"><Link className="break-words font-medium text-accent underline underline-offset-4" href={`/products/${row.handle}`}>{row.title}</Link><p className="mt-1 text-sm text-text-dim">{row.weightLb === null ? 'Weight not recorded' : `${finderWeight(row.weightLb)} · ${basisLabel(row.basis)}`}</p></li>)}</ul>{pageCount > 1 && <nav aria-label="Matching listing pages" className="mt-5 flex items-center justify-between gap-4 text-sm"><span>{page > 1 && <Link className="text-accent underline" href={pageHref(page - 1)}>Previous</Link>}</span><span>Page {page} of {pageCount}</span><span>{page < pageCount && <Link className="text-accent underline" href={pageHref(page + 1)}>Next</Link>}</span></nav>}</section>}
      <details className="border-t border-border py-5">
        <summary className="cursor-pointer font-semibold">Data coverage and definitions</summary>
        <div className="mt-4 space-y-3 text-sm leading-6 text-text-dim">
          <p>Snapshot checked <time dateTime={checked}>{checked.slice(0, 10)} at {checked.slice(11, 16)} UTC</time>. {catalog.sourceListings} catalog listings checked; {catalog.candidates} meet the catalog full-form classification and 140 cm height boundary; {catalog.rows.length} remain after exclusions. {catalog.excludedHolds} hold/test-tagged listings and {catalog.excludedMaterial} unclassified material listings are excluded. {catalog.rows.filter(row => row.weightLb === null).length} included listings have no recorded weight.</p>
          <p>These are listing-level observations, not unique body molds, market averages, lifting limits or supplier-confirmed shipping weights. A body may appear in several listings. Catalog full-form and material classifications use existing listing records; a hybrid label does not by itself verify the head/body construction. Missing heights and partial forms are outside this Finder.</p>
          <p>Ranges use the minimum and maximum positive listed weights at the exact recorded height and material classification. No interpolation, inferred total mass or sums of separately recorded head and body weights are used. Unit conversions are rounded to one decimal place; feet and inches are rounded to the nearest inch.</p>
          <p>Factory body-only values are identified from the existing MD factory-body measurement mapping. Other weights remain explicitly unspecified, even when additional measurements are present. Options, head choice and supplier revisions can change the final weight.</p>
          <p>Check the selected configuration before ordering. Stock and delivery depend on the listing and destination.</p>
        </div>
      </details>
      <nav aria-label="Related size and care guidance" className="flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-accent"><Link className="underline" href="/learn/sex-doll-size-weight-guide">Size and weight guide</Link><Link className="underline" href="/learn/sex-doll-storage">Storage guide</Link><Link className="underline" href="/shop/sex-dolls">Browse dolls</Link></nav>
    </section>
  );
}
