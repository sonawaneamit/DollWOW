import { ImageResponse } from 'next/og';
import type { LearnArticle } from '@/lib/learn/content';
import { articleProductHandles, articleProducts } from '@/lib/learn/productCards';
import { getProductsByHandles } from '@/lib/shopify/storefront';
import { productPublicTitle } from '@/lib/catalog/naming';

function ownedSocialPhoto(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'cdn.shopify.com' &&
      parsed.pathname.startsWith('/s/files/1/0960/7531/7432/files/');
  } catch { return false; }
}

async function photoData(url: string) {
  if (!ownedSocialPhoto(url)) return null;
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  const mime = response.headers.get('content-type')?.split(';')[0];
  if (!response.ok || !mime || !['image/jpeg', 'image/png', 'image/webp'].includes(mime) ||
    Number(response.headers.get('content-length')) > 8 * 1024 * 1024) return null;
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 8 * 1024 * 1024) return null;
  return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
}

export async function articleSocialImage(article: LearnArticle) {
  const handles = articleProductHandles(article.body);
  try {
    const products = articleProducts(handles, await getProductsByHandles(handles, { revalidate: 120 })).slice(0, 2);
    const photos: Array<{ src: string; title: string }> = [];
    for (const product of products) {
      const image = product.featuredImage ?? product.images[0];
      const src = image ? await photoData(image.url) : null;
      if (src) photos.push({ src, title: productPublicTitle(product) });
    }
    if (photos.length !== Math.min(2, handles.length) || !photos.length) return new Response(null, { status: 404 });
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#ffffff', color: '#252525' }}>
        {photos.map(photo => <div key={photo.title} style={{ display: 'flex', flexDirection: 'column', width: `${100 / photos.length}%`, height: '100%', padding: 12 }}>
          {/* Social rendering uses the same unaltered owned catalog photographs as the page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" width={photos.length === 2 ? 576 : 1176} height={530} style={{ objectFit: 'contain' }} />
          <div style={{ display: 'flex', fontSize: 20, lineHeight: 1.2, marginTop: 10 }}>{photo.title}</div>
        </div>)}
      </div>,
      { width: 1200, height: 630, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
