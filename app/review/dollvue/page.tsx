import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight, Eye, Search} from 'lucide-react';
import {privateDollVueBrandReview} from '@/lib/dollvue/privateBrandReview';
import styles from './Review.module.css';

export const metadata = {title: 'Private DollVue review', robots: {index: false, follow: false, nocache: true}};
export const dynamic = 'force-dynamic';

const brands = ['MMX', 'Fanreal'] as const;
const pageSize = 16;
const reviewPath = '/review/dollvue';
function browseUrl(brand: string, query = '', page = 1) {
  const params = new URLSearchParams({brand: brand.toLowerCase()});
  if (query) params.set('q', query);
  if (page > 1) params.set('page', String(page));
  return reviewPath + '?' + params;
}

export default async function Review({searchParams}: {
  searchParams: Promise<{brand?: string | string[]; q?: string | string[]; page?: string | string[]}>;
}) {
  const review = await privateDollVueBrandReview();
  const titles: Record<string, string> = (await import('@/data/draft-previews/mmx-fanreal-dollvue-review-titles.json')).default;
  const params = await searchParams;
  const brand = params.brand === 'fanreal' ? 'Fanreal' : 'MMX';
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const matches = review.records.filter(record => record.brand === brand &&
    query.toLowerCase().split(/\s+/).every(word =>
      (record.name + ' ' + titles[record.handle] + ' ' + record.handle).toLowerCase().includes(word)));
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const requested = typeof params.page === 'string' && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.min(pageCount, Math.max(1, requested));
  const records = matches.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.review}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}><Eye size={15} aria-hidden="true" /> Private eye-color review</p>
        <h1>Explore MMX and Fanreal in DollVue</h1>
        <p>Choose a portrait to compare eye colors on the original product photo. The rest of the portrait stays unchanged.</p>
        <div className={styles.examples}>
          <Link href={reviewPath + '/mmx-monica-163a-silicone-companion-doll'} prefetch={false}>Try MMX Monica <ArrowRight size={16} aria-hidden="true" /></Link>
          <Link href={reviewPath + '/fanreal-ling-170cm-d-cup-silicone-companion-doll'} prefetch={false}>Try Fanreal Ling <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </header>
      <div className={styles.toolbar}>
        <nav aria-label="Preview brands" className={styles.brands}>
          {brands.map(item => <Link key={item} href={browseUrl(item)} aria-current={item === brand ? 'page' : undefined}>
            {item} <span>{review.records.filter(record => record.brand === item).length}</span>
          </Link>)}
        </nav>
        <form action={reviewPath} method="get" className={styles.search}>
          <input type="hidden" name="brand" value={brand.toLowerCase()} />
          <input type="search" name="q" aria-label={`Search ${brand} models`} placeholder={`Search ${brand} models`} defaultValue={query} maxLength={100} />
          <button type="submit" aria-label="Search"><Search size={18} aria-hidden="true" /></button>
        </form>
      </div>
      <section aria-labelledby="models">
        <div className={styles.sectionHeading}>
          <h2 id="models">{brand} portraits</h2>
          <p>{matches.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, matches.length)} of ${matches.length}` : '0 matches'}</p>
        </div>
        {records.length ? <ul className={styles.grid}>
          {records.map(record => <li key={record.handle}>
            <Link className={styles.card} href={reviewPath + '/' + record.handle} prefetch={false}>
              <Image src={record.photo} width={record.mask.width} height={record.mask.height} alt="" />
              <div className={styles.cardBody}>
                <h3>{record.name}</h3>
                <p>{titles[record.handle] ?? record.handle}</p>
                <span>Preview eye colors <ArrowRight size={15} aria-hidden="true" /></span>
              </div>
            </Link>
          </li>)}
        </ul> : <div className={styles.empty}><p>No models match “{query}”.</p><Link href={browseUrl(brand)}>Clear search</Link></div>}
        {pageCount > 1 && <nav aria-label="Portrait pages" className={styles.pagination}>
          {page > 1 && <Link href={browseUrl(brand, query, page - 1)}>Previous</Link>}
          <span>Page {page} of {pageCount}</span>
          {page < pageCount && <Link href={browseUrl(brand, query, page + 1)}>Next</Link>}
        </nav>}
      </section>
      <details className={styles.notes}>
        <summary>About this private review</summary>
        <p>Colors are approximate; the preview does not simulate glass-eye patterns or materials. Hair, makeup, skin and other cosmetic options are still under review. No customer allowance, email or cart is used.</p>
      </details>
    </div>
  );
}
