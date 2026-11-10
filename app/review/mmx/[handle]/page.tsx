import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/ProductGallery';
import { mmxReviewEnabled, mmxReviewProducts } from '@/lib/catalog/mmxReview';
import { formatMoney } from '@/lib/utils/currency';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'MMX private product review', robots: { index: false, follow: false } };

export default async function MmxProductReview({ params }: { params: Promise<{ handle: string }> }) {
  if (!mmxReviewEnabled()) notFound();
  const { handle } = await params;
  const product = mmxReviewProducts().find(item => item.handle === handle);
  if (!product) notFound();
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <Link href="/review/mmx" className="text-sm font-semibold text-accent">← All MMX draft reviews</Link>
    <p className="mt-5 text-sm font-semibold text-accent">Private photo and specification review · Not published</p>
    <div className="mt-5 grid min-w-0 gap-8 lg:grid-cols-2">
      <div className="min-w-0"><ProductGallery product={product} /></div>
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold">{product.extended.displayName} · MMX {product.extended.bodyCode}</h1>
        <p className="mt-3 text-lg">{product.extended.headModel} head · Full-body silicone · Made to order</p>
        <p className="mt-5 text-2xl font-semibold">Draft base {formatMoney(Number(product.priceRange.minVariantPrice.amount), 'USD')}</p>
        <p className="mt-2 leading-7 text-text-dim">Shipping-inclusive retail and customization choices are still being checked. Checkout is unavailable in this review.</p>
        <h2 className="mt-7 text-xl font-semibold">Factory measurements</h2>
        <p className="mt-2 leading-7 text-text-dim">A, B and C in the body code identify molds, not cup sizes. Body weights exclude the head unless stated otherwise. View the official three-view body sheet in the gallery.</p>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(product.extended.measurements ?? {}).map(([label, value]) => <div key={label} className="rounded-md border border-border p-3"><dt className="text-sm text-text-dim">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}
        </dl>
        <p className="mt-5 leading-7 text-text-dim">Clothing and scene props are shown for styling. Factory videos can be selected using the gallery thumbnails. These photographs do not establish that every pictured upgrade is included in the draft base price.</p>
      </div>
    </div>
  </main>;
}
