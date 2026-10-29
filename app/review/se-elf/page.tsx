import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import listings from '@/data/draft-previews/se-elf-oct27.json';
import { isSeHalloweenPreview, seHalloweenEndLabel } from '@/lib/promotions/seHalloween2026';
import { SeHalloweenPromotion } from '@/components/promotions/SeHalloweenPromotion';
import pdps from '@/data/draft-previews/se-elf-pdps.json';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'SE Elf Listing Review', robots: { index: false, follow: false } };

export default function Page() {
  if (!isSeHalloweenPreview()) notFound();
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <h1 className="text-3xl font-semibold">SE Doll Elf listing review</h1>
    <p className="mt-3 text-text-dim">Preview only. No Shopify products, stock, prices or checkout changes. The four approved base prices include the photographed red or black skin.</p>
    <p className="mt-3 text-sm text-text-dim">Made to order from China, estimated delivery three weeks. The PDP previews below reuse the approved live SE parent menus. No new head options have been added. Checkout is disabled.</p>
    <nav className="my-5 flex flex-wrap gap-4" aria-label="SE Elf models">{listings.map(p=><a className="text-accent underline" key={p.sku} href={`#${p.sku}`}>{p.sku} {p.name}</a>)}</nav>
    <div className="divide-y divide-border">
      {listings.map(p=><section id={p.sku} key={p.sku} className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm text-text-dim">{p.sku} / {p.head}</p><h2 className="mt-1 text-2xl font-semibold">SE Doll {p.name}</h2><p className="mt-2">{p.heightCm} cm / {p.cup} cup / {p.skin} TPE Elf</p></div>
          <p className="text-2xl font-semibold">${p.priceUsd.toLocaleString('en-US')} <span className="text-sm font-normal">USD</span></p>
        </div>
        <a className="mt-3 inline-flex min-h-11 items-center text-accent underline" href={`/products/${pdps.find(item => item.id === `preview:se-elf:${p.sku}`)!.handle}`}>Open {p.name} PDP preview</a>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">{[1,2,3].map(n=><div key={n} className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface"><Image src={`/images/products/se-elf-2026/${p.sku}-${n}.jpg`} alt={`${p.name}, ${p.skin.toLowerCase()} adult Elf doll, supplier photograph ${n}`} fill sizes="(max-width: 639px) 100vw, 33vw" className="object-contain" /></div>)}</div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {[['Net weight',`${p.weightKg} kg / ${(p.weightKg*2.2046226218).toFixed(1)} lb`],['Bust / waist / hips',`${p.bustCm} / ${p.waistCm} / ${p.hipsCm} cm`],['Under bust',`${p.underBustCm} cm`],['Shoulders',`${p.shoulderCm} cm`],['Foot length',`${p.footCm} cm`],['Oral depth',`${p.oralCm} cm`],['Vaginal / anal depth',`${p.vaginalCm} / ${p.analCm} cm`],['Package',p.packageCm.join(' x ')+' cm']].map(([label,value])=><div key={label}><dt className="text-text-dim">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}
        </dl>
      </section>)}
    </div>
    <section className="border-t border-border py-6"><h2 className="text-xl font-semibold">Configuration review gates</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-dim">
        <li>Loose joints: supported lying positions only; cannot stand alone, sit unsupported or retain strong poses.</li>
        <li>Robot choices: Nodding and Waist-spin only; Hip-thrusting excluded.</li>
        <li>STPE plus silicone head: approved +$100 retail. Existing Light Tan/STPE compatibility restriction remains; no claim that red/black silicone heads are supported.</li>
        <li>Movable eyelids remain excluded for head #120 Melody.</li>
        <li>SED339 source pounds conflict with its 41 kg value; this preview converts 41 kg to 90.4 lb. All displayed pounds are calculated from the supplied kilograms.</li>
        <li>Halloween end is inferred: {seHalloweenEndLabel()}. Confirmation may change this single configured boundary. HALLOWEEN299 remains independent through 8 November.</li>
      </ul>
    </section>
    <SeHalloweenPromotion enabled initialClock={new Date().toISOString()} />
  </main>;
}
