'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { DisplayMoney } from '@/components/CurrencyProvider';
import { filterFinderCards, finderHeight, finderMaterials, finderQuery, finderWeight, type FinderBounds, type FinderCard, type FinderRanges } from '@/lib/catalog/sizeWeightFinder';
import styles from './SizeWeightFinder.module.css';

const pageSize = 24;
function RangeControl({ label, name, min, max, step, values, format, onChange }: {
  label: string; name: 'Height' | 'Weight'; min: number; max: number; step: number;
  values: [number, number]; format: (value: number) => string; onChange: (value: [number, number]) => void;
}) {
  const update = (index: number, raw: string) => {
    if (raw.trim() === '' || !Number.isFinite(Number(raw))) return;
    const value = Math.min(max, Math.max(min, Number(raw)));
    onChange(index === 0 ? [Math.min(value, values[1]), values[1]] : [values[0], Math.max(value, values[0])]);
  };
  return <fieldset className="min-w-0">
    <legend className="font-semibold">{label}</legend>
    <div className="mt-2 flex min-h-12 justify-between gap-3 text-sm">
      <output className="min-w-0" htmlFor={`min${name}`}>{format(values[0])}</output>
      <output className="min-w-0 text-right" htmlFor={`max${name}`}>{format(values[1])}</output>
    </div>
    <div className={styles.slider}>
      <div className={styles.track} />
      <div className={styles.selection} style={{ left: `${(values[0] - min) / (max - min) * 100}%`, right: `${(max - values[1]) / (max - min) * 100}%` }} />
      {values.map((value, index) => <input key={index} id={`${index ? 'max' : 'min'}${name}`} name={`${index ? 'max' : 'min'}${name}`} type="range" min={min} max={max} step={step} value={value}
        aria-label={`${label} ${index ? 'maximum' : 'minimum'}`} aria-valuetext={format(value)}
        className={styles.handle} style={{ zIndex: index === 0 && value === max ? 3 : index + 1, transform: values[0] === values[1] ? `translateY(${index ? 8 : -8}px)` : undefined }}
        onChange={event => update(index, event.target.value)} />)}
    </div>
  </fieldset>;
}

export function SizeWeightFinder({ rows, bounds, initial, initialPage = 1 }: {
  rows: FinderCard[]; bounds: FinderBounds; initial: FinderRanges; initialPage?: number;
}) {
  const [ranges, setRanges] = useState(initial);
  const [page, setPage] = useState(initialPage);
  const matches = useMemo(() => filterFinderCards(rows, ranges), [rows, ranges]);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const change = (next: FinderRanges) => { setRanges(next); setPage(1); };
  const reset = () => change({ ...bounds, materials: [] });
  return <>
    <form action="/tools/doll-size-weight-finder" method="get" onSubmit={event => event.preventDefault()} className="mt-6 border-y border-border py-5">
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-10">
        <RangeControl label="Height" name="Height" min={bounds.minHeight} max={bounds.maxHeight} step={1} values={[ranges.minHeight, ranges.maxHeight]} format={finderHeight}
          onChange={([minHeight, maxHeight]) => change({ ...ranges, minHeight, maxHeight })} />
        <RangeControl label="Weight" name="Weight" min={bounds.minWeight} max={bounds.maxWeight} step={0.1} values={[ranges.minWeight, ranges.maxWeight]}
          format={value => finderWeight(value * 2.2046226218)} onChange={([minWeight, maxWeight]) => change({ ...ranges, minWeight, maxWeight })} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <fieldset className="flex min-w-0 flex-wrap items-center gap-2"><legend className="mb-2 text-sm font-medium">Material</legend>
          {finderMaterials.map(option => <label key={option.value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${ranges.materials.includes(option.value) ? 'border-accent bg-white text-accent' : 'border-border bg-transparent'}`}>
            <input type="checkbox" name="material" value={option.value} checked={ranges.materials.includes(option.value)} className="h-4 w-4 rounded border-border accent-[#a43426]"
              onChange={() => change({ ...ranges, materials: ranges.materials.includes(option.value) ? ranges.materials.filter(value => value !== option.value) : [...ranges.materials, option.value] })} />{option.label}
          </label>)}
        </fieldset>
        <Link href="/tools/doll-size-weight-finder" onClick={event => { event.preventDefault(); reset(); }} className="flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset</Link>
      </div>
      <noscript><button type="submit" className="mt-4 min-h-11 rounded-md bg-accent px-5 font-semibold text-white">Apply filters</button></noscript>
    </form>
    <div className="py-5"><p role="status" aria-live="polite" aria-atomic="true" className="font-semibold" data-finder-count>{matches.length} matching {matches.length === 1 ? 'listing' : 'listings'}</p>
      {!!matches.length && <p className="mt-1 text-sm text-text-dim">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, matches.length)}</p>}
    </div>
    {!matches.length ? <div className="border-y border-border py-10"><h2 className="text-lg font-semibold">No matching listings</h2><p className="mt-2 text-text-dim">No dolls with a listed weight match these ranges.</p><Link href="/tools/doll-size-weight-finder" onClick={event => { event.preventDefault(); reset(); }} className="mt-4 inline-block min-h-11 text-accent underline">Reset filters</Link></div> :
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 lg:grid-cols-4" aria-label="Matching dolls" data-finder-results>
        {visible.map(row => <li key={row.id} className="min-w-0" data-finder-card data-height={row.heightCm} data-weight={row.weightLb}>
          <Link href={`/products/${row.handle}`} className="group block h-full rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-white">
              {row.image ? <Image src={row.image} alt={row.title} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-contain transition-transform group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center p-3 text-center text-sm text-text-dim">Photo unavailable</div>}
            </div>
            <h2 className="mt-3 break-words text-sm font-semibold leading-5 sm:text-base">{row.title}</h2>
            <p className="mt-2 text-xs leading-5 text-text-dim sm:text-sm">{finderHeight(row.heightCm)}</p>
            <p className="text-xs leading-5 text-text-dim sm:text-sm">{finderWeight(row.weightLb)}</p>
            <p className="mt-2 text-sm font-semibold">{row.price ? <DisplayMoney amount={row.price} currencyCode={row.currency} /> : 'Price unavailable'}</p>
          </Link>
        </li>)}
      </ul>}
    {pages > 1 && <nav aria-label="Matching listing pages" className="mt-7 flex items-center justify-between gap-3 text-sm">
      {currentPage > 1 ? <Link className="min-h-11 content-center text-accent underline" href={finderQuery(ranges, currentPage - 1)} onClick={event => { event.preventDefault(); setPage(currentPage - 1); }}>Previous</Link> : <span />}
      <span>Page {currentPage} of {pages}</span>
      {currentPage < pages ? <Link className="min-h-11 content-center text-accent underline" href={finderQuery(ranges, currentPage + 1)} onClick={event => { event.preventDefault(); setPage(currentPage + 1); }}>Next</Link> : <span />}
    </nav>}
  </>;
}
