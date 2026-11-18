import snapshot from "@/content/references/price-size-index-2026-10.json";

export const priceSizeIndexGuide = "/learn/sex-doll-size-weight-guide";
export const priceSizeIndexJson = "/datasets/doll-price-size-review.json";
export const priceSizeIndexCsv = "/datasets/doll-price-size-review.csv";

export function getPriceSizeIndexReview() {
  return process.env.VERCEL_ENV === "preview" ? snapshot : null;
}

export const priceSizeIndexMethod = [
  "The unit is a published catalog listing, not a unique physical model, available unit or completed sale.",
  "The source is DollWOW's public catalog, captured on 23 October 2026. Include inferred full-form listings at least 140cm tall with positive finite base prices and valid currencies; exclude missing heights, hold-tag signals and flagged youthful wording. These screening rules do not certify product appearance or authorization.",
  "Price is the minimum listed variant base price in USD, not a configured quote or checkout total. Selected options, promotions, freight, tax and duties are not calculated here.",
  "Only identical repeated record IDs are collapsed; conflicting same-ID records fail validation. Separate warehouse, head and configuration offers remain separate. Heuristic identity overlaps are not confirmed duplicates.",
  "Medians and quartiles use sorted values with linear interpolation at (n - 1) times the requested fraction. Listings have equal weight; no sales or market weighting is applied.",
  "The August size-and-weight edition uses a different cohort and method. The two snapshots do not establish price changes, catalog growth or a time-series index.",
  "No new weight aggregate is provided because generic weight fields do not establish a consistent complete-doll mass. Heights are catalog-reported, not independently measured."
] as const;

export function priceSizeIndexPayload() {
  const data = getPriceSizeIndexReview();
  if (!data) return null;
  return {
    name: "DollWOW catalog price and height snapshot - October review draft",
    status: "review-draft",
    canonicalGuide: `https://dollwow.com${priceSizeIndexGuide}`,
    methodology: priceSizeIndexMethod,
    ...data
  };
}

export function priceSizeIndexCsvText() {
  const data = getPriceSizeIndexReview();
  if (!data) return null;
  return "currency,height_band,listing_count,median_listed_base_price,median_listed_height_cm\n" +
    data.heightBands.map(b => [b.currency, b.band, b.listingCount, b.medianListedBasePrice, b.medianListedHeightCm].join(",")).join("\n") + "\n";
}

export function priceSizeIndexSchema() {
  const data = getPriceSizeIndexReview();
  if (!data) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `https://dollwow.com${priceSizeIndexGuide}#october-price-height-review`,
    name: "DollWOW catalog price and height snapshot - October review draft",
    description: "A dated, listing-weighted snapshot of minimum listed USD variant base prices and reported heights in a screened DollWOW catalog cohort; not a market average, checkout quote or unique-model census.",
    url: `https://dollwow.com${priceSizeIndexGuide}#october-price-height-review`,
    creator: { "@type": "Organization", name: "DollWOW", url: "https://dollwow.com" },
    dateModified: data.snapshotAt,
    temporalCoverage: data.snapshotAt.slice(0, 10),
    measurementTechnique: priceSizeIndexMethod.join(" "),
    variableMeasured: ["minimum listed variant base price (USD)", "catalog-reported height (cm)", "catalog listing count"],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `https://dollwow.com${priceSizeIndexJson}` },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `https://dollwow.com${priceSizeIndexCsv}` }
    ]
  };
}
