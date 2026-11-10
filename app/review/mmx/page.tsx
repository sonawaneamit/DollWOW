import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mmxHeldReviews, mmxReviewEnabled, mmxReviewProducts } from '@/lib/catalog/mmxReview';
import { formatMoney } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'MMX private photo and specification review', robots: { index: false, follow: false } };

export default function MmxReview() {
  if (!mmxReviewEnabled()) notFound();
  const products = mmxReviewProducts();
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <p className="text-sm font-semibold text-accent">Private review · Not published</p>
    <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">MMX photos and specifications</h1>
    <p className="mt-4 max-w-3xl leading-7 text-text-dim">Review the existing 20 drafts against the official body sheets and matching factory media. Nineteen have draft base prices; the 153cm seamless model remains held without a price.</p>
    <p className="mt-3 max-w-3xl leading-7 text-text-dim">This is a photo and specification checkpoint. Shipping-inclusive prices and body-specific customization are still under review. These pages cannot add products to a cart and are not a go-live approval request.</p>
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map(product => <article key={product.id} className="overflow-hidden rounded-lg border border-border bg-surface">
        <Link href={`/review/mmx/${product.handle}`} className="block">
          {product.featuredImage ? <Image src={product.featuredImage.url} alt={product.title} width={640} height={800} sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 90vw" className="aspect-[4/5] w-full object-cover" /> : null}
          <div className="space-y-2 p-5"><h2 className="text-xl font-semibold">{product.extended.displayName} · {product.extended.bodyCode}</h2>
            <p className="text-sm text-text-dim">{product.extended.headModel} head · {product.images.length} images · {product.media?.filter(item => item.type === 'video').length ?? 0} factory videos</p>
            <p>Draft base {formatMoney(Number(product.priceRange.minVariantPrice.amount), 'USD')}</p>
            <p className="font-semibold text-accent">Review photos and measurements →</p>
          </div>
        </Link>
      </article>)}
      {mmxHeldReviews.map(product => <article key={product.handle} className="overflow-hidden rounded-lg border border-border bg-surface">
        {product.featuredImage ? <Image src={product.featuredImage.url} alt={product.title} width={640} height={800} sizes="(min-width:1024px) 30vw, 90vw" className="aspect-[4/5] w-full object-cover" /> : null}
        <div className="space-y-2 p-5"><h2 className="text-xl font-semibold">MengFei · 153cm seamless</h2><p className="font-semibold">Held offline — price quote pending</p><p className="text-sm text-text-dim">The supplier sheet confirms 33kg including the head. No foot-length claim or public price is shown.</p></div>
      </article>)}
    </div>
  </main>;
}
