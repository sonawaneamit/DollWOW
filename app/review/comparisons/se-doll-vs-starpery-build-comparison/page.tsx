import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Minus, Sparkles } from 'lucide-react';
import { getProductsByHandles } from '@/lib/shopify/storefront';
import { protectedProductImageUrlFor } from '@/lib/catalog/productImage';
import { isDollVueCatalogProduct, dollVueUrl } from '@/lib/dollvue/config';
import { DisplayMoney } from '@/components/CurrencyProvider';
import { seStarperyPilot, seStarperyPilotEnabled, seStarperyPriceGap } from '@/lib/learn/seStarperyPilot';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: seStarperyPilot.title, description: seStarperyPilot.description,
  robots: { index: false, follow: false },
  alternates: { canonical: `https://dollwow.com/learn/${seStarperyPilot.slug}` }
};

export default async function SeStarperyPilotPage() {
  if (!seStarperyPilotEnabled(process.env.VERCEL_ENV)) notFound();
  const models = seStarperyPilot.models;
  const products = await getProductsByHandles(models.map(model => model.handle), { revalidate: 120 });
  const entries = models.map(model => ({ model, product: products.find(product => product.handle === model.handle) }));
  if (entries.some(({ product }) => !product || product.tags.some(tag => /hold|dollwow-test|dollwow-system/i.test(tag)))) notFound();
  const prices = entries.map(({ product }) => product!.priceRange.minVariantPrice);
  const sameCurrency = prices[0].currencyCode === prices[1].currencyCode;
  const gap = sameCurrency ? seStarperyPriceGap(prices[0].amount, prices[1].amount) : null;
  const dollVueEntries = entries.filter(({ product }) => isDollVueCatalogProduct(product!));
  return <div data-se-starpery-pilot>
    <section className="tone-section" data-tone="deep"><div className="tone-inner">
      <Link href="/learn" className="text-sm font-semibold text-gold-300">DollWOW buying guides</Link>
      <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">{seStarperyPilot.title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-ivory-300">{seStarperyPilot.description}</p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-8">
        {entries.map(({ model, product }, index) => {
          const photo = protectedProductImageUrlFor(product!, product!.featuredImage ?? product!.images[0], 'card');
          return <div key={model.handle} className="min-w-0">
            <Link href={`/products/${model.handle}`} className="relative block aspect-[3/4] overflow-hidden rounded-md bg-black/20" aria-label={`Explore ${model.brand} ${model.name}`}>
              {photo ? <Image src={photo} alt={`${model.brand} ${model.name}, factory product photograph`} fill priority sizes="(min-width: 1024px) 550px, 45vw" className="object-contain" /> : null}
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase text-gold-300">{model.brand}</p>
            <h2 className="mt-1 text-2xl font-semibold">{model.name}</h2>
            <p className="mt-2 text-sm text-ivory-300">{model.height} cm / {model.weight} kg</p>
            <p className="mt-2 text-sm">From <strong><DisplayMoney amount={prices[index].amount} currencyCode={prices[index].currencyCode} /></strong></p>
          </div>;
        })}
      </div>
    </div></section>
    <section className="tone-section" data-tone="blush"><div className="tone-inner">
      <h2 className="text-3xl font-semibold">The short answer</h2>
      <p className="mt-4 max-w-3xl text-base leading-8">For these two 161 cm builds, I would choose <a href="#alba-a" className="underline">Alba A</a> for lower weight and a narrower silhouette, and <a href="#amy" className="underline">Amy</a> for a fuller figure and the silicone head included in the base price. Neither is a lightweight object: even Alba A weighs 35 kg.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {entries.map(({ model, product }, index) => <article key={model.handle} id={index ? 'amy' : 'alba-a'} className="min-w-0 scroll-mt-24 border-t border-current/20 pt-6">
          <p className="text-sm font-semibold">{model.pick}</p>
          <h3 className="mt-2 text-2xl font-semibold">{model.brand} {model.name}</h3>
          <p className="mt-4 text-base leading-7">{model.verdict}</p>
          <div className="mt-5 flex items-start gap-3"><Check className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /><p className="text-sm leading-7"><strong>Why I would buy her:</strong> {model.advantage}</p></div>
          <div className="mt-3 flex items-start gap-3"><Minus className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /><p className="text-sm leading-7"><strong>The trade-off:</strong> {model.tradeoff}</p></div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <Link href={`/products/${model.handle}`} className="inline-flex items-center gap-2 font-semibold underline">Explore {model.name}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <Link href={`/products/${model.handle}#build-studio`} className="font-semibold underline">Customize {model.name}</Link>
            {isDollVueCatalogProduct(product!) ? <Link href={dollVueUrl(model.handle)} className="inline-flex items-center gap-2 font-semibold underline"><Sparkles className="h-4 w-4" aria-hidden="true" />Try {model.name} in DollVue</Link> : null}
          </div>
        </article>)}
      </div>
    </div></section>
    <section className="tone-section" data-tone="deep"><div className="tone-inner">
      <h2 className="text-3xl font-semibold">What changes when you live with them?</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <div><h3 className="text-xl font-semibold">Moving and storage: Alba A</h3><p className="mt-3 text-sm leading-7">She is 17.5 kg lighter, with a 50 cm waist and 89 cm hips. That makes her the more manageable choice of this pair. Plan safe lifting and storage for either doll; a lighter listing is not a promise that one person can lift her comfortably.</p></div>
        <div><h3 className="text-xl font-semibold">A fuller silhouette: Amy</h3><p className="mt-3 text-sm leading-7">Amy has a 109 cm bust and 125 cm hips, compared with Alba A&apos;s 83 cm and 89 cm. Pick her for that generous shape, not because both dolls happen to be the same height. Clothing and storage space should follow her measurements.</p></div>
        <div><h3 className="text-xl font-semibold">A silicone face: Amy</h3><p className="mt-3 text-sm leading-7">Amy starts with a hard silicone head and a TPE body. Alba A&apos;s base uses the original head; her separate silicone-head choice changes the total. If that face material is on your must-have list, Amy includes it from the start.</p></div>
      </div>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm"><caption className="pb-4 text-left text-lg font-semibold">The two bodies, side by side</caption><thead><tr className="border-b border-current/25"><th className="p-3">Detail</th>{models.map(m => <th key={m.handle} className="p-3">{m.name}</th>)}</tr></thead><tbody>
          {(['height', 'weight', 'bust', 'waist', 'hips'] as const).map(key => <tr key={key} className="border-b border-current/15"><th className="p-3 capitalize">{key}</th>{models.map(m => <td key={m.handle} className="p-3">{m[key]} {key === 'weight' ? 'kg' : 'cm'}</td>)}</tr>)}
        </tbody></table>
      </div>
    </div></section>
    <section className="tone-section" data-tone="blush"><div className="tone-inner">
      <h2 className="text-3xl font-semibold">Where I would spend the difference</h2>
      <p className="mt-4 max-w-3xl text-base leading-8">{gap ? <>Alba A currently starts <strong><DisplayMoney amount={gap.toFixed(2)} currencyCode={prices[0].currencyCode} /> lower</strong>. </> : null}If you prefer her proportions and are happy with the original head, she is my value pick. If a silicone face and Amy&apos;s curves are the attraction, Amy is the more direct buy: you are paying for the build you actually want.</p>
      <p className="mt-4 max-w-3xl text-base leading-8">I would not name a low-maintenance winner here: both default builds use TPE bodies. A silicone head does not make the body silicone. Put the same care into drying, storage and the <Link href="/learn/tpe-vs-silicone-sex-dolls" className="underline">material decision</Link> with either choice. Your chosen upgrades, delivery, tax and eligible checkout offers determine the final total.</p>
    </div></section>
    <section className="tone-section" data-tone="deep"><div className="tone-inner">
      <p className="text-sm font-semibold text-gold-300">DollVue</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold">Your taste does not have to stop at the factory photo.</h2>
      <p className="mt-4 max-w-3xl text-base leading-8">A different hairstyle, eye color or skin tone can change the mood of a doll. Explore the appearance choices available in DollVue, then return to the product&apos;s customizer to choose the build you want. DollVue images are labelled previews, not factory photographs.</p>
      <div className="mt-6 flex flex-wrap gap-5"><Link href="/dollvue" className="inline-flex items-center gap-2 font-semibold text-gold-300 underline">Explore DollVue<Sparkles className="h-5 w-5" aria-hidden="true" /></Link>{dollVueEntries.map(({ model }) => <Link key={model.handle} href={dollVueUrl(model.handle)} className="font-semibold text-gold-300 underline">Try {model.name} your way</Link>)}</div>
      <p className="mt-8 max-w-3xl text-base leading-8">Still choosing? Start with the shape you love, then decide which weight and head construction you want to live with. That gets you further than choosing a brand name in isolation.</p>
      <nav aria-label="Explore SE Doll and Starpery" className="mt-6 flex flex-wrap gap-6"><Link href="/brands/se-doll" className="font-semibold underline">Shop SE Doll</Link><Link href="/brands/starpery-dolls" className="font-semibold underline">Shop Starpery</Link></nav>
    </div></section>
  </div>;
}
