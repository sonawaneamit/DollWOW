import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { comparisonChecks, comparisonFaqs, comparisonFaqSchema, comparisonPreviewEnabled, comparisonSources, featureComparisons } from "@/lib/learn/poweredFeatureComparison";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Powered Oral Features: Brand Comparison | DollWOW" },
  description: "Compare powered head features with motorized neck and body movement. Understand naming, compatibility and what to verify for an exact configured doll.",
  robots: { index: false, follow: false }
};

export default function PoweredFeaturePreview() {
  if (!comparisonPreviewEnabled(process.env.VERCEL_ENV ?? process.env.NODE_ENV, process.env.DOL288_PREVIEW)) notFound();
  const article = {
    "@context": "https://schema.org", "@type": "Article",
    headline: "Powered Oral Features: Brand Comparison",
    description: metadata.description,
    publisher: { "@type": "Organization", name: "DollWOW" },
    citation: comparisonSources.map(source => source.url)
  };
  return <article>
    {[article, comparisonFaqSchema()].map(schema => <script key={schema["@type"]} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
    <section className="tone-section" data-tone="deep">
      <div className="tone-inner">
        <Link href="/learn" className="text-sm text-gold-300 underline underline-offset-4">Learning Center</Link>
        <p className="mt-6 text-sm text-gold-300">Features &amp; Configuration</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-ivory-50 sm:text-4xl">Powered Oral Features: Brand Comparison</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-ivory-200">A powered mouth feature and a motor that moves the head are different systems. The phrase &ldquo;auto BJ&rdquo; can refer to either. Start with the mechanism, then check the exact head and body configuration.</p>
        <nav aria-label="In this guide" className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gold-300">
          <a href="#comparison" className="underline underline-offset-4">Brand comparison</a>
          <a href="#names" className="underline underline-offset-4">Names that mislead</a>
          <a href="#checks" className="underline underline-offset-4">Before choosing</a>
          <a href="#questions" className="underline underline-offset-4">Questions</a>
        </nav>
      </div>
    </section>
    <section className="tone-section" data-tone="blush">
      <div className="tone-inner space-y-12">
        <div className="max-w-3xl space-y-4 text-base leading-7">
          <h2 className="text-2xl font-semibold">Same label, different equipment</h2>
          <p><strong>Head features</strong> can include a powered mouth module or tongue mechanism. <strong>Body-driven movement</strong> uses a motor in the neck or body. Neither automatically includes the other, and a manual movable-jaw head is not a powered system.</p>
          <p>Manufacturer-documented rows below link to the source. Other rows are leads from the brand research, not verified specifications or a promise that every model supports the option. This is not hands-on testing, a performance ranking or an exhaustive list of every current factory offering.</p>
        </div>
        <div id="comparison" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold">Compare by mechanism, not the marketing name</h2>
          <div role="region" aria-label="Brand feature comparison" tabIndex={0} className="mt-6 overflow-x-auto rounded-md border border-black/20 focus-visible:outline focus-visible:outline-2">
            <table className="w-full min-w-[740px] border-collapse text-left text-sm leading-6">
              <caption className="sr-only">Powered feature names, mechanism and evidence by brand. Exact configuration confirmation remains essential.</caption>
              <thead className="bg-black/5"><tr>{["Brand / option names", "What the name describes", "Evidence"].map(label => <th key={label} scope="col" className="p-4 font-semibold">{label}</th>)}</tr></thead>
              <tbody>{featureComparisons.map(row => <tr key={row.brand} className="border-t border-black/15 align-top">
                <th scope="row" className="w-[27%] p-4 font-semibold">{row.brand}<span className="mt-1 block font-normal">{row.names}</span></th>
                <td className="w-[43%] p-4">{row.mechanism}</td>
                <td className="p-4">{row.evidence}{row.sources.map(id => <a key={id} href={`#source-${id}`} className="mt-1 block underline underline-offset-4">{comparisonSources.find(s => s.id === id)?.title}</a>)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">The configuration checks that matter</h2>
          <div className="mt-5 divide-y divide-black/20">{featureComparisons.map(row => <details key={row.brand} className="py-4">
            <summary className="cursor-pointer font-semibold">{row.brand}</summary>
            <p className="mt-3 leading-7">{row.check}</p>
          </details>)}</div>
        </div>
        <div id="names" className="max-w-3xl scroll-mt-24 space-y-4 leading-7">
          <h2 className="text-2xl font-semibold">Names that need extra care</h2>
          <p><strong>ROS is not a motor.</strong> A soft head or movable jaw does not establish powered operation. Heating alone is not automatic movement either.</p>
          <p><strong>&ldquo;Sucking&rdquo; does not always mean oral.</strong> The research identifies WM&apos;s &ldquo;Blowjob Sucker&rdquo; and the auto-sucking labels used by Top CY, Starpery and Fanreal as vaginal functions. Check the option description rather than inferring its location from the name.</p>
          <p><strong>Yuedoll and Yearndoll are different brands.</strong> The Yuedoll automatic-oral label remains unclassified: the research did not establish its mechanism. It is not included as a confirmed powered specification.</p>
          <p><strong>No powered feature found is not proof of absence.</strong> Research found no established powered oral specification for Lusandy, Loribear, Starpery, Fanreal, Zelex, XTDOLL, FunWest, Climax, Sino, Gynoid, Tayu, Elsa Babe, HR or AIBEI. Manual head features must be checked separately; do not transfer one brand&apos;s capabilities to another.</p>
        </div>
        <div id="checks" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold">Before choosing a configured build</h2>
          <ol className="mt-5 max-w-3xl list-decimal space-y-3 pl-6 leading-7">{comparisonChecks.map(check => <li key={check}>{check}</li>)}</ol>
          <p className="mt-5 max-w-3xl leading-7">A ready-to-ship listing needs its own installed-equipment check. A factory option menu is not warehouse proof. Do not rely on an old stock sheet, generic feature badge or another customer&apos;s build.</p>
          <figure className="mt-8 max-w-sm">
            <Image src="/images/learn/custom-sex-dolls/build-order.webp" width={864} height={1821} alt="Illustrated configuration checklist: model, appearance, structure, supported functions and final checks" className="h-auto w-full" sizes="(max-width: 420px) 90vw, 384px" />
            <figcaption className="mt-3 text-sm leading-6">Illustrated planning reference, not a photograph of installed equipment or a compatibility guarantee.</figcaption>
          </figure>
          <Link href="/learn/custom-sex-dolls" className="mt-5 inline-block underline underline-offset-4">Plan a custom configuration</Link>
        </div>
        <div className="max-w-3xl space-y-4 leading-7">
          <h2 className="text-2xl font-semibold">Catalog examples to verify</h2>
          <p>These Top Fire body listings name both powered oral movement and hip motion. They require head selection; they are not interchangeable with a complete configured doll. Review the product details and confirm the fitted equipment and current stock before choosing.</p>
          <ul className="list-disc space-y-3 pl-6">
            <li><Link className="underline underline-offset-4" href="/products/top-fire-doll-170cm-h-cup-silicone-body-choose-your-head-auto-blowjob-hip-rotation-in-stock-us">Top Fire 170cm H-cup body with head selection</Link></li>
            <li><Link className="underline underline-offset-4" href="/products/top-fire-doll-176cm-d-cup-silicone-body-choose-your-head-auto-blowjob-hip-rotation-in-stock-us">Top Fire 176cm D-cup body with head selection</Link></li>
          </ul>
          <p>Brand-level reports for the other rows are not linked to an assumed matching configuration. A listing link alone does not prove stock, compatibility or entitlement to an upgrade.</p>
        </div>
        <div id="questions" className="max-w-3xl scroll-mt-24">
          <h2 className="text-2xl font-semibold">Common questions</h2>
          <div className="mt-5 divide-y divide-black/20">{comparisonFaqs.map(faq => <details key={faq.question} className="py-4"><summary className="cursor-pointer font-semibold">{faq.question}</summary><p className="mt-3 leading-7">{faq.answer}</p></details>)}</div>
        </div>
        <div className="max-w-3xl leading-7">
          <h2 className="text-2xl font-semibold">Sources &amp; limits</h2>
          <p className="mt-4">Manufacturer documentation establishes that a feature exists, not that it is fitted to a particular order. The remaining brand leads require exact source and configuration confirmation. No owner anecdotes, comparative performance scores, universal repair promises or unverified price and weight estimates are used here.</p>
          <ul className="mt-5 list-disc space-y-3 pl-6">{comparisonSources.map(source => <li id={`source-${source.id}`} key={source.id} className="scroll-mt-24"><a href={source.url} className="underline underline-offset-4" rel="noreferrer">{source.title}</a></li>)}</ul>
        </div>
      </div>
    </section>
  </article>;
}
