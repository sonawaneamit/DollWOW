'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DisplayMoney } from '@/components/CurrencyProvider';
import { finderHeight, finderWeight } from '@/lib/catalog/sizeWeightFinder';
import styles from './CatalogListingCard.module.css';

export type CatalogListing = {
  handle: string; title: string; image: string | null;
  heightCm: number | null; weightLb: number | null;
  weightText?: string;
  price: string | null; currency: string;
};

export function CatalogListingCard({ row, heading = 'h2' }: { row: CatalogListing; heading?: 'h2' | 'h3' }) {
  const Heading = heading;
  return <Link href={`/products/${row.handle}`} className={`group block h-full rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${styles.card}`}>
    <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-white">
      {row.image ? <Image src={row.image} alt={row.title} fill sizes="(min-width: 1024px) 380px, 45vw" className="object-contain transition-transform group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center p-3 text-center text-sm text-text-dim">Photo unavailable</div>}
    </div>
    <Heading className={`mt-3 break-words text-sm font-semibold leading-5 sm:text-base ${styles.title}`}>{row.title}</Heading>
    <p className={`mt-2 text-xs leading-5 text-text-dim sm:text-sm ${styles.measurement}`}>{row.heightCm === null ? 'Height not listed' : finderHeight(row.heightCm)}</p>
    <p className={`text-xs leading-5 text-text-dim sm:text-sm ${styles.weight}`}>{row.weightText ?? (row.weightLb === null ? 'Weight not listed' : finderWeight(row.weightLb))}</p>
    <p className={`mt-2 text-sm font-semibold ${styles.price}`}>{row.price ? <DisplayMoney amount={row.price} currencyCode={row.currency} /> : 'Price unavailable'}</p>
  </Link>;
}
