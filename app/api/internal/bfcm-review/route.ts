import { NextResponse } from 'next/server';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { getProductAdminMetafieldsByHandle, mergeProductAdminMetafields } from '@/lib/shopify/admin';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { withBfcmPreview, bfcmPreviewConfig, bfcmCalculatedCart } from '@/lib/promotions/bfcmBrandPreview';
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.DOL371_BRAND_PREVIEW !== '1') return new NextResponse(null,{status:404});
  const handle = new URL(request.url).searchParams.get('handle');
  if(!handle) return NextResponse.json({error:'handle required'},{status:400});
  const [source, admin] = await Promise.all([getProductByHandle(handle), getProductAdminMetafieldsByHandle(handle)]);
  if(!source) return new NextResponse(null,{status:404});
  const product=withBfcmPreview(mergeProductAdminMetafields(source,admin));
  const catalog=getCustomizationConfig(product);
  const offer=product.extended.bfcmPreview;
  const {config, flags}=offer ? bfcmPreviewConfig(catalog,offer) : {config:catalog,flags:[]};
  const selections=getDefaultSelections(config);
  const priced=resolveCustomization(config,selections,Number(product.priceRange.minVariantPrice.amount));
  return NextResponse.json({handle,offer:offer??null,flags,basePrice:product.priceRange.minVariantPrice, selections, issues:priced.issues,
    calculatedCart:bfcmCalculatedCart(priced.totalPrice),groups:config.groups.map(g=>({id:g.id,label:g.label,options:g.options.map(o=>({id:o.id,label:o.label,price:o.priceDelta,purchasable:o.purchasable}))}))},{headers:{'X-Robots-Tag':'noindex','Cache-Control':'no-store'}});
}
