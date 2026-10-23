import { Download } from "lucide-react";
import { getPriceSizeIndexReview, priceSizeIndexCsv, priceSizeIndexJson, priceSizeIndexMethod, priceSizeIndexSchema } from "@/lib/references/priceSizeIndex";

const number = (value: number) => value.toLocaleString("en-US");
const dollars = (value: number) => `US$${number(value)}`;

export function PriceSizeIndexReview() {
  const data = getPriceSizeIndexReview();
  if (!data) return null;
  const summary = data.summary;
  return (
    <section id="october-price-height-review" aria-labelledby="price-height-review-heading" className="my-10 border-y border-border py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(priceSizeIndexSchema()) }} />
      <p className="text-sm font-semibold text-accent">October snapshot - review draft</p>
      <h2 id="price-height-review-heading" className="mt-2 text-2xl font-semibold text-text">What our catalog listed on 23 October 2026</h2>
      <p className="mt-4 leading-7">Among {number(data.includedListingCount)} listings meeting the stated screening rules, the median listed base price was {dollars(summary.medianListedBasePrice)} and the median listed height was {summary.medianListedHeightCm}cm.</p>
      <p className="mt-3 leading-7 text-text-dim">These are catalog listings, not unique models, confirmed stock or a market-wide average. The middle half of listed base prices fell between {dollars(summary.middleHalfListedBasePrice[0])} and {dollars(summary.middleHalfListedBasePrice[1])}; listed heights between {summary.middleHalfListedHeightCm[0]}cm and {summary.middleHalfListedHeightCm[1]}cm. Options, promotions, shipping, taxes and duties are not calculated.</p>
      <div className="mt-6 max-w-full overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" role="region" aria-label="October price and height table" tabIndex={0}>
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <caption className="mb-3 text-left text-sm text-text-dim">Listing-weighted USD base prices by reported height; five non-overlapping bands.</caption>
          <thead><tr className="border-b border-border"><th scope="col" className="py-3 pr-4">Height (cm)</th><th scope="col" className="py-3 pr-4">Listings</th><th scope="col" className="py-3">Median base price</th></tr></thead>
          <tbody>{data.heightBands.map(b => <tr key={b.band} className="border-b border-border"><th scope="row" className="py-3 pr-4 font-normal">{b.band.replace("under", "under ")}</th><td className="py-3 pr-4">{number(b.listingCount)}</td><td className="py-3">{dollars(b.medianListedBasePrice)}</td></tr>)}</tbody>
        </table>
      </div>
      <details className="mt-6 border-t border-border pt-4">
        <summary className="cursor-pointer font-semibold">Coverage, duplicate handling and uncertainty</summary>
        <p className="mt-3 leading-7 text-text-dim">Captured {data.snapshotAt}. Of {number(data.sourceRecordCount)} public source records, {number(data.includedListingCount)} met the cohort rules and {number(data.excludedListingCount)} were excluded. {data.exactDuplicateIdsRemoved} exact repeated IDs were removed. {data.repeatedHeuristicGroups} heuristic identity groups span {data.listingsInRepeatedHeuristicGroups} listings; they are not verified duplicates and were not merged. The unique factory-model count is unknown.</p>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-6 text-text-dim">{priceSizeIndexMethod.map(text => <li key={text}>{text}</li>)}</ul>
      </details>
      <nav aria-label="October aggregate dataset downloads" className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
        <a href={priceSizeIndexCsv} className="inline-flex items-center gap-2 underline underline-offset-4"><Download size={16} aria-hidden="true" />Aggregate CSV</a>
        <a href={priceSizeIndexJson} className="inline-flex items-center gap-2 underline underline-offset-4"><Download size={16} aria-hidden="true" />Aggregate JSON</a>
      </nav>
      <p className="mt-4 text-sm leading-6 text-text-dim">The August size-and-weight edition above uses a different cohort. These snapshots do not establish price changes or catalog growth. No new overall weight statistic is calculated from mixed or unverified weight bases.</p>
    </section>
  );
}
