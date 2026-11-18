import Image from 'next/image';
import Link from 'next/link';
import { CatalogListingCard } from '@/components/CatalogListingCard';
import { articleListing } from '@/lib/learn/productCards';
import type { Product } from '@/types/product';

export function ArticleProductCards({ products, label }: { products: Product[]; label: string }) {
  if (!products.length) return null;
  return <div role="list" aria-label={label} data-article-products className="my-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5">
    {products.map(product => <div role="listitem" key={product.id} className="min-w-0" data-article-product={product.handle}>
      <CatalogListingCard row={articleListing(product)} heading="h3" />
    </div>)}
  </div>;
}

export function ArticleProductHero({ products }: { products: Product[] }) {
  const photos = products.map(articleListing).filter(row => row.image).slice(0, 2);
  if (!photos.length) return null;
  return <div data-article-product-hero className="mt-7 grid max-w-4xl grid-cols-2 gap-3 sm:gap-5">
    {photos.map(row => <Link key={row.handle} href={`/products/${row.handle}`} className="block min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <div className="relative aspect-[4/5] bg-white">
        <Image src={row.image!} alt={row.title} fill priority sizes="(min-width: 1024px) 440px, 45vw" className="object-contain" />
      </div>
      <p className="mt-3 break-words text-sm font-semibold leading-5 text-ivory-50">{row.title}</p>
    </Link>)}
  </div>;
}
