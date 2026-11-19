import { NextResponse } from 'next/server';
import { getPrivateDraftPreview } from '@/lib/catalog/privateDraftPreview';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections } from '@/lib/customization/resolve';
import { loadTemplateRecipe } from '@/lib/customization/template-loader';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { withBfcmPreview, bfcmPreviewConfig, bfcmCalculatedCart } from '@/lib/promotions/bfcmBrandPreview';
export async function GET(request: Request) {
 if(process.env.VERCEL_ENV!=='preview'||process.env.DOL382_TOPFIRE_PREVIEW!=='1')return new NextResponse(null,{status:404});
 const handle=new URL(request.url).searchParams.get('handle')??'';
 const source=await getPrivateDraftPreview(handle);
 if(!source||!['gid://shopify/Product/10742344941752','gid://shopify/Product/10742344974520'].includes(source.id))return new NextResponse(null,{status:404});
 const product=withBfcmPreview(source);const catalog=getCustomizationConfig(source);const recipe=await loadTemplateRecipe(source);
 const priced=product.extended.bfcmPreview?bfcmPreviewConfig(catalog,product.extended.bfcmPreview).config:catalog;
 const tiers=templateConfigurationPresets(recipe??null,catalog,priced,Number(product.priceRange.minVariantPrice.amount),getDefaultSelections(priced));
 return NextResponse.json({handle,media:source.media?.length,images:source.images.length,tiers,offer:product.extended.bfcmPreview,baseCart:bfcmCalculatedCart(Number(product.priceRange.minVariantPrice.amount))},{headers:{'X-Robots-Tag':'noindex','Cache-Control':'no-store'}});
}
