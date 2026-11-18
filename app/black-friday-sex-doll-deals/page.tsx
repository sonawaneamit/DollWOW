import PromoCode from './PromoCode';
import campaign from './campaign-content.json';
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sex Doll Black Friday Deals 2026 – $299 Off',
  description: 'Save $299 on qualifying dolls and stack eligible brand deals from Top Fire, Fanreal, Irontech and more. Compare Black Friday and Cyber Monday offers.',
  alternates: { canonical: '/black-friday-sex-doll-deals' },
  ...(process.env.VERCEL_ENV === 'preview' ? { robots: { index: false, follow: false } } : {}),
};
const mobileBanners: Record<string, string> = {
  Avant: 'avant-mobile',
  'MD Doll': 'md-doll-mobile',
  'Real Lady': 'real-lady-mobile',
};

const saleEnds = 'December 10';
const promoCode = 'BLACKFRIDAYWOW26';
const liveFaqs = [
  ['When does the Black Friday sale end?', 'DollWOW’s $299 offer runs through December 10. Brand offers have their own dates. Top Fire runs through December 14 and Galatea through December 31.'],
  ['Does the $299 discount stack with brand deals?', 'Yes. Eligible brand discounts apply first, then DollWOW’s $299 comes off.'],
  ['Which dolls qualify for $299 off?', 'Qualifying dolls priced $900 or more. Use BLACKFRIDAYWOW26 at checkout. Standalone heads are excluded.'],
  ['Do you have Cyber Monday deals?', 'The $299 offer runs through Cyber Monday and into December. Check each brand’s dates for its own offer.'],
];
export const dynamic = 'force-dynamic';

export default function BfcmPreviewPage() {
  const brandPreview = process.env.VERCEL_ENV === 'preview' && process.env.DOL371_BRAND_PREVIEW === '1';
  const faqs = brandPreview ? liveFaqs.map(([question, answer], index) => [question, index === 0 ? 'DollWOW’s $299 code and these Top Fire, Galatea, Climax and 6YE offers end December 10 at 11:59 pm Eastern. IDO ends November 30. Other brand dates are shown above.' : index === 2 ? 'Use BLACKFRIDAYWOW26 for $299 off an order subtotal of $900 or more after eligible brand discounts, before tax and shipping.' : answer]) : liveFaqs;
  const previewDeals: Record<string, string> = {
    'Top Fire': '$150 off full silicone dolls + one free second head. Add BLACKFRIDAYWOW26 for another $299 off qualifying orders.',
    'Galatea (Dolls Castle)': 'Factory orders include body heating, vaginal suction and oral heating FREE. Add BLACKFRIDAYWOW26 for $299 off qualifying orders.',
    'Climax': '10% off custom full-size dolls priced $900+ with a free extra head, gel butt and eligible hands/feet upgrade. Custom torsos include a free extra head and gel butt. Warehouse stock excluded. Stack BLACKFRIDAYWOW26 on qualifying orders.',
  };
  const brands = brandPreview ? [
    ...campaign.brands.filter(b => b.name !== 'IDO').map(b => previewDeals[b.name] ? { ...b, deal: previewDeals[b.name], dates: 'DollWOW offer ends December 10 at 11:59 pm Eastern' } : b),
    { name: '6YE', deal: '5% off + one free extra head on full-size dolls. Stack BLACKFRIDAYWOW26 for another $299 off orders of $900+.', dates: 'Ends December 10 at 11:59 pm Eastern', label: 'Shop 6YE', url: '/brands/6ye-dolls', banners: [] },
    { name: 'IDO', deal: 'Warehouse dolls $2,499. China-made orders $2,599 with one extra random wig and a moving pad FREE. Take another $299 off with BLACKFRIDAYWOW26.', dates: 'November 1–30', label: 'Shop IDO', url: '/brands/ido-dolls', banners: [] },
  ] : campaign.brands;
  return (
    <article className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="border-b border-border pb-8">
        <div className="relative isolate overflow-hidden rounded-2xl bg-[#170d0c] text-[#fff2df]">
          <Image
            src="/promo/bfcm-2026/hero-the-gift.jpg"
            alt="Fanreal Mirella in a black velvet evening dress at a holiday salon"
            fill
            priority
            sizes="(min-width: 1152px) 1088px, 100vw"
            className="object-cover object-[82%_25%] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#170d0c] via-[#170d0c]/65 to-transparent sm:bg-gradient-to-r sm:via-[#170d0c]/45" />
          <div className="relative flex min-h-[510px] w-full flex-col items-start px-5 pt-7 pb-48 sm:min-h-[490px] sm:w-1/2 sm:justify-center sm:px-12 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[.26em] text-[#e8bc80] sm:text-sm">DollWOW</p>
            <p className="mt-4 font-display text-3xl font-semibold leading-none sm:text-6xl">Black Friday</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-[#f0cfa4] sm:text-sm">&amp; Cyber Monday</p>
            <p className="mt-6 font-display text-5xl font-semibold leading-none sm:text-8xl">$299 off</p>
            <p className="mt-2 text-sm font-medium sm:text-lg">On qualifying dolls</p>
            <p className="mt-4 max-w-56 text-xs leading-relaxed text-[#ffe0b5] sm:text-sm">Stacks with eligible brand offers</p>
            <PromoCode code={promoCode} />
            <a href="#brand-offers" className="mt-4 w-fit rounded-md bg-[#f2cf9b] px-4 py-2 text-sm font-bold text-[#170d0c]">Shop the deals</a>
            <p className="mt-2 text-xs">Ends {saleEnds}.</p>
          </div>
        </div>
        <h1 className="mt-8 font-display text-4xl font-semibold">Sex Doll Black Friday Deals 2026</h1>
        <p className="mt-2 text-sm text-text-dim">Updated November 17, 2026</p>
        <div className="mt-5 rounded-xl border border-border p-5">
          <p className="font-semibold">The deal in 10 seconds</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>{brandPreview ? 'Save $299 on order subtotals of $900 or more after brand discounts through December 10.' : 'Save $299 on qualifying dolls priced $900 or more through December 10.'}</li>
            <li>Stack your $299 with eligible brand discounts and upgrades.</li>
            <li>Top Fire full silicone dolls get $449 off plus a free second head.</li>
          </ul>
        </div>
      </header>
      <section className="mt-10" aria-labelledby="brand-offers">
        <h2 id="brand-offers" className="font-display text-3xl font-semibold">Sex doll Black Friday deals by brand</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map(({ name, deal, dates, label, url, banners }) => (
            <article key={name} className="rounded-xl border border-border p-5">
              <div className="relative mb-4 aspect-video overflow-hidden rounded-md bg-[#140f0d]">
                {banners[0] ? (
                  <picture>
                    {mobileBanners[name] && <source media="(max-width: 639px)" srcSet={`/promo/bfcm-2026/brands/${mobileBanners[name]}.jpg`} />}
                    <img src={`/promo/bfcm-2026/brands/${banners[0]}.jpg`} alt={`${name} Black Friday deal: ${deal}`} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
                  </picture>
                ) : (
                  <div className="flex h-full flex-col justify-center p-5 text-[#f2cf9b]">
                    <p className="font-display text-2xl font-semibold">{name}</p>
                    <p className="mt-2 text-sm">{deal}</p>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold">{name} Black Friday deal</h3>
              <p className="mt-2">{deal}</p>
              <p className="mt-3 text-sm text-text-dim">{dates}</p>
              <a className="mt-4 inline-block font-semibold underline" href={url}>{label}</a>
            </article>
          ))}
        </div>
        <p className="mt-5"><strong>More brand sales</strong> · Tantaly: 20% off, Nov 24–30.</p>
      </section>
      <section className="mt-10" aria-labelledby="savings-examples">
        <h2 id="savings-examples" className="font-display text-3xl font-semibold">How the discounts add up</h2>
        <p className="mt-3">Examples in USD for eligible base builds while both offers are available. Optional upgrades and tax may change your total.</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-5">
            <dt className="font-semibold">Top Fire Wendy 170cm</dt>
            <dd className="mt-2">$2,349 − $150 brand offer − $299 = <strong>$1,900</strong>. A free second head is included on the qualifying full silicone build.</dd>
          </div>
          <div className="rounded-xl border border-border p-5">
            <dt className="font-semibold">Fanreal Mirella Real Skin 155cm</dt>
            <dd className="mt-2">$2,880 − $288 brand offer (10%) − $299 = <strong>$2,293</strong>.</dd>
          </div>
          <div className="rounded-xl border border-border p-5">
            <dt className="font-semibold">WM Jessa Monroe 170cm</dt>
            <dd className="mt-2">$2,300 − $230 brand offer (10%) − $299 = <strong>$1,771</strong> during WM’s November 20–December 6 offer.</dd>
          </div>
        </dl>
      </section>
      <section className="mt-10" aria-labelledby="store-comparison">
        <h2 id="store-comparison" className="font-display text-3xl font-semibold">Sex doll Black Friday deals at other stores</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <caption className="pb-3 text-left text-sm">Sex doll Black Friday deals compared: savings on a $2,000 doll</caption>
            <thead><tr>{['Store', 'Black Friday deal', 'Save on a $2,000 doll', 'Good to know'].map((label) => <th key={label} scope="col" className="border-b border-border p-3">{label}</th>)}</tr></thead>
            <tbody>{campaign.comparison.map(([name, offer, savings, details], index) => (
              <tr key={name} className={index === 0 ? 'bg-surface-tint font-semibold' : undefined}>
                <th scope="row" className="border-b border-border p-3">{name}</th>
                <td className="border-b border-border p-3">{offer}</td>
                <td className="border-b border-border p-3">{savings}</td>
                <td className="border-b border-border p-3">{details}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <section className="mt-10 border-t border-border pt-8" aria-labelledby="holiday-deals">
        <h2 id="holiday-deals" className="font-display text-3xl font-semibold">Sex doll Cyber Monday &amp; holiday deals</h2>
        <p className="mt-3">Black Friday is just the start. Shop the $299 offer through December 10, and see the brand dates above for deals that continue through the holidays.</p>
      </section>
      <section className="mt-10" aria-labelledby="bfcm-faq">
        <h2 id="bfcm-faq" className="font-display text-3xl font-semibold">Sex doll Black Friday FAQ</h2>
        {faqs.map(([question, answer]) => (
          <details key={question} className="border-b border-border py-4">
            <summary className="cursor-pointer font-semibold">{question}</summary>
            <p className="mt-3">{answer}</p>
          </details>
        ))}
      </section>
      <div className="mt-10 rounded-xl border border-border p-6">
        <p className="font-display text-2xl font-semibold">Find your Black Friday deal</p>
        <a className="mt-3 inline-block font-semibold underline" href="/shop/sex-dolls">Shop all dolls</a>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
      }) }} />
    </article>
  );
}
