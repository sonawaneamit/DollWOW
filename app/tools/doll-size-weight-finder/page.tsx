import type { Metadata } from 'next';
import Link from 'next/link';
import { getSizeWeightSnapshot } from '@/lib/catalog/sizeWeightSnapshot';
import { finderBounds, finderCards, finderRanges, type FinderParams } from '@/lib/catalog/sizeWeightFinder';
import { SizeWeightFinder } from '@/components/SizeWeightFinder';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<FinderParams> }): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: 'Doll Size & Weight Finder',
    description: 'Find full dolls 140 cm and taller by height and listed-weight ranges. Compare photos, prices and measurements, with optional material filters.',
    alternates: { canonical: '/tools/doll-size-weight-finder', types: { 'text/markdown': '/markdown/tools/doll-size-weight-finder' } },
    robots: { index: Object.keys(params).length === 0, follow: true },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<FinderParams> }) {
  const params = await searchParams;
  let catalog;
  try { catalog = await getSizeWeightSnapshot(); }
  catch {
    return <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><h1 className="text-3xl font-semibold">Doll Size &amp; Weight Finder</h1><p className="mt-4">Current listing data is temporarily unavailable.</p><Link className="mt-4 inline-block underline" href="/learn/sex-doll-size-weight-guide">Size and weight guide</Link></section>;
  }
  const rows = finderCards(catalog.rows);
  const bounds = finderBounds(rows);
  const initial = finderRanges(params, bounds);
  const page = typeof params.page === 'string' && /^\d+$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dollwow.com').replace(/\/$/, '');
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Doll Size & Weight Finder',
    url: `${siteUrl}/tools/doll-size-weight-finder`, applicationCategory: 'ShoppingApplication', operatingSystem: 'Web',
    description: 'Find full dolls 140 cm and taller using height and listed-weight ranges and optional material filters. Weights come from listing data, not factory-confirmed specs.',
    publisher: { '@type': 'Organization', name: 'DollWOW', url: siteUrl } };
  return <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <h1 className="text-3xl font-semibold text-text sm:text-4xl">Doll Size &amp; Weight Finder</h1>
    <p className="mt-3 text-text-dim">Find your fit. Full dolls, 140 cm and taller.</p>
    <SizeWeightFinder rows={rows} bounds={bounds} initial={initial} initialPage={page} checkedAt={catalog.checkedAt} />
    <nav aria-label="Related size and care guidance" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-accent">
      <Link className="underline" href="/learn/sex-doll-size-weight-guide">Size and weight guide</Link><Link className="underline" href="/learn/sex-doll-storage">Storage guide</Link><Link className="underline" href="/shop/sex-dolls">Browse dolls</Link>
    </nav>
  </section>;
}
