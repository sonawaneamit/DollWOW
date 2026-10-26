import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowRight,Sparkles} from 'lucide-react';
import {getProductByHandle,getProductsByHandles} from '@/lib/shopify/storefront';
import {getCurrentDollVueHolds} from '@/lib/dollvue/currentHold';
import {protectedProductImageUrlFor} from '@/lib/catalog/productImage';
import {productPublicTitle} from '@/lib/catalog/naming';
import {areDollVueSelectionsValid,dollVueUrl,isDollVueCatalogProduct} from '@/lib/dollvue/config';
import {resolveCurrentDollVueEligibility} from '@/lib/dollvue/eligibility';
import {DisplayMoney} from '@/components/CurrencyProvider';
import {S40LookCarousel} from '@/components/reference/S40LookCarousel';
import {s40CardLabel,s40DollVueLooks,s40FeaturedLooks,s40PilotEnabled,s40PilotHandles} from '@/lib/learn/s40Pilot';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Irontech S40: Eileen, Your Way',description:'Meet Eileen in five real factory looks, explore her listed builds and make your own version in DollVue.',robots:{index:false,follow:false}};

export default async function S40Pilot(){
  if(!s40PilotEnabled(process.env.VERCEL_ENV))notFound();
  const products=await getProductsByHandles([...s40PilotHandles],{revalidate:120});
  const holds=await getCurrentDollVueHolds(products.map(p=>p.id));
  const cleared=products.filter(p=>p.extended.headModel==='head-s40'&&/irontech/i.test(p.extended.brand??p.vendor)&&holds.get(p.id)==='clear'&&!p.tags.some(t=>/hold|dollwow-test|dollwow-system/i.test(t)));
  const entries=s40PilotHandles.flatMap(handle=>{
    const product=cleared.find(p=>p.handle===handle);
    const image=product?protectedProductImageUrlFor(product,product.featuredImage??product.images[0],'card'):null;
    return product&&image?[{product,image}]:[];
  });
  const looks=s40FeaturedLooks.flatMap(look=>{
    const entry=entries.find(e=>e.product.handle===look.handle);
    return entry?[{...look,image:entry.image}]:[];
  });
  if(looks.length!==5)notFound();
  const muse=entries.find(e=>e.product.handle===s40PilotHandles[0]&&isDollVueCatalogProduct(e.product));
  if(!muse)notFound();
  const fullMuse=await getProductByHandle(muse.product.handle,{cache:'no-store',strict:true}).catch(()=>null);
  if(!fullMuse||fullMuse.id!==muse.product.id)notFound();
  const museEligibility=await resolveCurrentDollVueEligibility(fullMuse);
  if(!museEligibility.available||s40DollVueLooks.some(look=>!areDollVueSelectionsValid(museEligibility.config,[...look.selections])))notFound();
  return <div data-s40-pilot>
    <section className="tone-section" data-tone="deep"><div className="tone-inner">
      <Link href="/brands/irontech-dolls" className="text-sm font-semibold text-gold-300">Irontech Dolls</Link>
      <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">Irontech S40: Eileen, Your Way</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-ivory-300">Eileen has the quiet confidence of someone who can make a simple outfit feel like an entrance. At rest, her gaze is thoughtful rather than smiley; a change of hair or makeup brings out her softer or more dramatic side. Irontech calls this face S40, a useful name to look for across her different builds.</p>
      <div className="mt-8"><S40LookCarousel looks={looks}/></div>
    </div></section>
    <section className="tone-section" data-tone="blush"><div className="tone-inner">
      <h2 className="max-w-3xl text-3xl font-semibold">For the collector who loves a little range</h2>
      <p className="mt-4 max-w-3xl text-base leading-8">We like Eileen for a collector who wants one recognizable face with plenty of range. Brunette waves give her a romantic, screen-star mood; a neat bob makes her feel more everyday; blonde hair and glasses add a playful edge. Her full lips and steady gaze suit a composed, grown-up look. If you prefer an open smile or a more animated expression, another face may catch your eye first.</p>
      <div className="mt-8 border-t border-current/20 pt-8">
        <p className="text-sm font-semibold">DollVue</p>
        <h2 className="mt-3 text-3xl font-semibold">Try this head your way in DollVue</h2>
        <p className="mt-4 max-w-3xl text-base leading-8">Keep the face you love. Change her hair, eyes or skin tone and see a new side of Eileen before you choose your build. Soft and romantic, sharp and dramatic, or somewhere entirely your own: make this S40 yours.</p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-s40-dollvue-looks>
          {s40DollVueLooks.map(look=><figure key={look.image} className="min-w-0">
            <div className="relative aspect-[9/16] overflow-hidden rounded-md bg-black/10">
              <Image src={look.image} alt={`DollVue preview of Eileen S40: ${look.title}`} fill sizes="(min-width:640px) 440px, 90vw" className="object-contain"/>
            </div>
            <figcaption className="mt-3"><span className="block text-sm font-semibold">DollVue preview</span><span className="mt-1 block text-base">{look.title}</span></figcaption>
          </figure>)}
        </div>
        <div className="mt-6 flex flex-wrap gap-5">
          <Link href={dollVueUrl(muse.product.handle)} className="inline-flex items-center gap-2 rounded-md bg-ink-950 px-5 py-3 font-semibold text-ivory-50">Try this head your way in DollVue<Sparkles className="h-5 w-5" aria-hidden="true"/></Link>
          <Link href={`/products/${muse.product.handle}#build-studio`} className="inline-flex items-center gap-2 py-3 font-semibold underline">Customize this Eileen<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>
        </div>
      </div>
    </div></section>
    <section className="tone-section" data-tone="deep"><div className="tone-inner">
      <h2 className="text-3xl font-semibold">Find your Eileen</h2>
      <p className="mt-4 max-w-3xl text-base leading-8">Explore {entries.length} listed S40 builds, from different body shapes to different materials. Start with the silhouette you love; each listing has its own measurements, options and current price.</p>
      <p className="mt-3 max-w-3xl text-sm leading-7">The same face comes on different body and material combinations, so these builds have different starting prices; selected upgrades change the final total.</p>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {entries.map(({product,image})=>{
          const price=product.priceRange.minVariantPrice;
          return <article key={product.handle} className="min-w-0" data-s40-listing={product.handle}>
            <Link href={`/products/${product.handle}`} className="relative block aspect-[3/4] overflow-hidden rounded-md bg-black/10" aria-label={`Explore ${productPublicTitle(product)}`}>
              <Image src={image} alt={productPublicTitle(product)} fill sizes="(min-width:1024px) 280px, 45vw" className="object-contain"/>
            </Link>
            <h3 className="mt-3 text-base font-semibold"><Link href={`/products/${product.handle}`} className="underline decoration-current/30 underline-offset-4">{s40CardLabel(product.handle)}</Link></h3>
            <p className="mt-2 text-sm text-ivory-300">{product.extended.heightCm} cm / {product.extended.material}</p>
            <p className="mt-2 text-sm">From <DisplayMoney amount={price.amount} currencyCode={price.currencyCode}/></p>
            <Link href={`/products/${product.handle}#build-studio`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gold-300">Explore this build<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>
          </article>;
        })}
      </div>
      <nav aria-label="Explore more Irontech" className="mt-10 flex flex-wrap gap-6 border-t border-current/20 pt-6"><Link href="/brands/irontech-dolls" className="font-semibold underline">More Irontech dolls</Link><Link href="/dollvue" className="font-semibold underline">Explore DollVue</Link></nav>
    </div></section>
  </div>;
}
