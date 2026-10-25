import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowRight,Check,Minus,Sparkles} from 'lucide-react';
import {getProductByHandle,getProductsByHandles} from '@/lib/shopify/storefront';
import {getCurrentDollVueHolds} from '@/lib/dollvue/currentHold';
import {resolveCurrentDollVueEligibility} from '@/lib/dollvue/eligibility';
import {areDollVueSelectionsValid,dollVueUrl} from '@/lib/dollvue/config';
import {protectedProductImageUrl,protectedProductImageUrlFor} from '@/lib/catalog/productImage';
import {DisplayMoney} from '@/components/CurrencyProvider';
import {amyDollVueLooks,seStarperyPicks,seStarperyTradeoffs,seStarperyPilot,seStarperyPilotEnabled,seStarperyPriceGap} from '@/lib/learn/seStarperyPilot';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:seStarperyPilot.title,description:seStarperyPilot.description,robots:{index:false,follow:false},alternates:{canonical:`https://dollwow.com/learn/${seStarperyPilot.slug}`}};

export default async function SeStarperyPilotPage(){
 if(!seStarperyPilotEnabled(process.env.VERCEL_ENV))notFound();
 const models=seStarperyPilot.models;
 const products=await getProductsByHandles(models.map(m=>m.handle),{revalidate:120});
 const holds=await getCurrentDollVueHolds(products.map(p=>p.id));
 const entries=models.map(model=>({model,product:products.find(p=>p.handle===model.handle)}));
 if(entries.some(({product:p})=>!p||holds.get(p.id)!=='clear'||p.tags.some(t=>/hold|dollwow-test|dollwow-system/i.test(t))))notFound();
 const full=await Promise.all(models.map(m=>getProductByHandle(m.handle,{cache:'no-store',strict:true}).catch(()=>null)));
 if(full.some((p,i)=>!p||p.id!==entries[i].product!.id))notFound();
 const eligibility=await Promise.all(full.map(p=>resolveCurrentDollVueEligibility(p!)));
 if(!eligibility[1].available||amyDollVueLooks.some(l=>!areDollVueSelectionsValid(eligibility[1].config,[...l.selections])))notFound();
 const prices=entries.map(({product})=>product!.priceRange.minVariantPrice);
 const gap=prices[0].currencyCode===prices[1].currencyCode?seStarperyPriceGap(prices[0].amount,prices[1].amount):null;
 return <div data-se-starpery-pilot>
  <section className="tone-section" data-tone="deep"><div className="tone-inner">
   <Link href="/learn" className="text-sm font-semibold text-gold-300">DollWOW buying guides</Link>
   <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">{seStarperyPilot.title}</h1>
   <p className="mt-5 max-w-3xl text-lg leading-8">{seStarperyPilot.description}</p>
   <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-8">{entries.map(({model,product},i)=>{
    const photo=protectedProductImageUrlFor(product!,product!.featuredImage??product!.images[0],'card');
    return <article key={model.handle} className="min-w-0">
     <Link href={`/products/${model.handle}`} className="relative block aspect-[3/4] overflow-hidden rounded-md bg-black/20" aria-label={`Explore ${model.brand} ${model.name}`}>
      {photo?<Image src={photo} alt={`${model.brand} ${model.name}, factory photograph`} fill priority sizes="(min-width:1024px) 550px, 45vw" className="object-contain"/>:null}
     </Link>
     <p className="mt-4 text-xs font-semibold uppercase text-gold-300">{model.brand}</p><h2 className="mt-1 text-2xl font-semibold">{model.name}</h2>
     <p className="mt-2 text-sm text-ivory-300"><span className="whitespace-nowrap">{model.height} cm</span> / <span className="whitespace-nowrap">{model.weight} kg</span></p>
     <p className="mt-2 text-sm">From <strong><DisplayMoney amount={prices[i].amount} currencyCode={prices[i].currencyCode}/></strong></p>
    </article>;
   })}</div>
  </div></section>
  <section className="tone-section" data-tone="blush"><div className="tone-inner">
   <h2 className="text-3xl font-semibold">Our picks, by what matters to you</h2>
   <p className="mt-4 max-w-3xl text-base leading-8">We would choose Alba A for a leaner, lower-weight build and Amy for a more generous silhouette. Here is where each earns her place.</p>
   <div className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">{seStarperyPicks.map(pick=><article key={pick.need} className="border-t border-current/20 pt-5" data-need-pick>
    <h3 className="text-lg font-semibold">{pick.need}</h3><Link href={pick.modelIndex?'#amy':'#alba-a'} className="mt-2 inline-flex items-center gap-2 text-xl font-semibold underline">{models[pick.modelIndex].brand} {models[pick.modelIndex].name}<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link><p className="mt-3 text-sm leading-7">{pick.reason}</p>
   </article>)}</div>
  </div></section>
  <section className="tone-section" data-tone="deep"><div className="tone-inner">
   <h2 className="text-3xl font-semibold">The faces and the trade-offs</h2>
   <div className="mt-8 grid gap-10 md:grid-cols-2">{entries.map(({model},i)=><article key={model.handle} id={i?'amy':'alba-a'} className="min-w-0 scroll-mt-24">
    <Link href={`/products/${model.handle}`} className="relative block aspect-[4/3] overflow-hidden rounded-md bg-black/20" aria-label={`${model.name} face detail`}><Image src={protectedProductImageUrl(model.handle,i?4:5,'card')} alt={`${model.name}, face detail from a factory photograph`} fill sizes="(min-width:768px) 500px, 90vw" className={`object-cover ${i?'object-top':'object-center'}`}/></Link>
    <h3 className="mt-5 text-2xl font-semibold">{model.brand} {model.name}</h3>
    <p className="mt-3 text-base leading-7">{i?'Amy has a softer, naturalistic expression. We like her for a curvier, more relaxed boudoir look.':'Alba A has bold lips and a more dramatic, styled face. We like her for a dressed-up, fashion-led look.'}</p>
    <h4 className="mt-6 text-lg font-semibold">The advantages</h4><ul className="mt-3 space-y-3">{seStarperyTradeoffs[i].pros.map(pro=><li key={pro} className="flex gap-3 text-sm leading-7"><Check className="mt-1 h-4 w-4 shrink-0" aria-hidden="true"/><span>{pro}</span></li>)}</ul>
    <h4 className="mt-6 text-lg font-semibold">The compromises</h4><ul className="mt-3 space-y-3">{seStarperyTradeoffs[i].cons.map(con=><li key={con} className="flex gap-3 text-sm leading-7"><Minus className="mt-1 h-4 w-4 shrink-0" aria-hidden="true"/><span>{con}</span></li>)}</ul>
    <div className="mt-6 flex flex-wrap gap-4"><Link href={`/products/${model.handle}#build-studio`} className="font-semibold underline">Customize {model.name}</Link>{eligibility[i].available?<Link href={dollVueUrl(model.handle)} className="inline-flex items-center gap-2 font-semibold underline"><Sparkles className="h-4 w-4" aria-hidden="true"/>Try {model.name} in DollVue</Link>:null}</div>
   </article>)}</div>
  </div></section>
  <section className="tone-section" data-tone="blush"><div className="tone-inner">
   <h2 className="text-3xl font-semibold">Where the build changes your decision</h2>
   <p className="mt-4 max-w-3xl text-base leading-8">Alba A is <strong className="whitespace-nowrap">17.5 kg</strong> lighter in these listed builds.{gap?<> Her starting price is also <strong><DisplayMoney amount={gap.toFixed(2)} currencyCode={prices[0].currencyCode}/></strong> lower.</>:null} That is the practical case for Alba A; Amy makes her case with her shape and face.</p>
   <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[280px] text-left text-sm"><caption className="pb-4 text-left text-lg font-semibold">The base builds at a glance</caption>
    <thead><tr className="border-b border-current/25"><th className="p-3">Detail</th>{models.map(m=><th key={m.handle} className="p-3">{m.name}</th>)}</tr></thead>
    <tbody>
     <tr className="border-b border-current/15"><th className="p-3">Body Material</th><td className="p-3">Regular TPE</td><td className="p-3">TPE</td></tr>
     <tr className="border-b border-current/15"><th className="p-3">Head</th><td className="p-3">Original head</td><td className="p-3">Hard silicone</td></tr>
     <tr className="border-b border-current/15"><th className="p-3">Bust</th>{models.map(m=><td key={m.handle} className="whitespace-nowrap p-3">{m.bust} cm</td>)}</tr>
     <tr className="border-b border-current/15"><th className="p-3">Skeleton Choices</th><td className="p-3">Standard / EVO</td><td className="p-3">Gear / Ballet</td></tr>
    </tbody></table></div>
   <p className="mt-5 max-w-3xl text-sm leading-7">Both default bodies are TPE. Choose the softness and finish you prefer, then plan the same essentials: drying, supported storage and regular care. <Link href="/learn/tpe-vs-silicone-sex-dolls" className="underline">Compare TPE and silicone</Link>.</p>
  </div></section>
  <section className="tone-section" data-tone="deep"><div className="tone-inner">
   <h2 className="text-3xl font-semibold">SE Doll vs Starpery, beyond these two</h2><div className="mt-6 grid gap-8 md:grid-cols-2">
    <div><h3 className="text-xl font-semibold">SE Doll: start with your material and style</h3><p className="mt-3 text-sm leading-7">SE is worth browsing when you want a wide choice of styled faces and builds, from its TPE range to Silicone Pro. Alba A is the TPE, slimmer-figure route into that range; she is not a stand-in for every SE body.</p><Link href="/learn/se-doll-buying-guide" className="mt-4 inline-block font-semibold underline">The SE Doll buying guide</Link></div>
    <div><h3 className="text-xl font-semibold">Starpery: explore the shape and face together</h3><p className="mt-3 text-sm leading-7">Starpery is worth browsing when body shape is central to your choice, with fuller BBW figures alongside slimmer builds and different head constructions. Amy is our fuller-figure choice here; the wider collection includes different materials and body generations.</p><Link href="/learn/starpery-dolls-buying-guide" className="mt-4 inline-block font-semibold underline">The Starpery buying guide</Link></div>
   </div>
  </div></section>
  <section className="tone-section" data-tone="blush"><div className="tone-inner">
   <p className="text-sm font-semibold">DollVue</p><h2 className="mt-3 text-3xl font-semibold">Make her yours</h2><p className="mt-4 max-w-3xl text-base leading-8">Here is Amy in two different looks, using her available wig and eye choices.</p>
   <div className="mt-6 grid max-w-4xl gap-6 sm:grid-cols-2" data-amy-dollvue-looks>{amyDollVueLooks.map(look=><figure key={look.image} className="min-w-0"><div className="relative aspect-[2/3] overflow-hidden rounded-md bg-black/10"><Image src={look.image} alt={`DollVue preview of Amy: ${look.title}`} fill sizes="(min-width:640px) 440px, 90vw" className="object-contain"/></div><figcaption className="mt-3"><span className="block text-sm font-semibold">DollVue preview</span><span className="mt-1 block">{look.title}</span></figcaption></figure>)}</div>
   <Link href={dollVueUrl(models[1].handle)} className="mt-6 inline-flex items-center gap-2 font-semibold underline">Try Amy in DollVue<Sparkles className="h-4 w-4" aria-hidden="true"/></Link>
   <div className="mt-10 border-t border-current/20 pt-8"><h2 className="text-2xl font-semibold">Choose the build that belongs in your life</h2><p className="mt-4 max-w-3xl text-base leading-8">Choose Alba A for the leaner, more manageable build. Choose Amy when you want the fuller figure. Pick your favorite, make the details yours, and let us help you get the build right.</p><div className="mt-6 flex flex-wrap gap-4">{models.map(m=><Link key={m.handle} href={`/products/${m.handle}#build-studio`} className="inline-flex items-center gap-2 rounded-md bg-ink-950 px-5 py-3 font-semibold text-ivory-50">Customize {m.name}<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>)}</div></div>
  </div></section>
 </div>;
}
