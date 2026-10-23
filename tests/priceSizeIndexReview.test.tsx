import React from "react";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { PriceSizeIndexReview } from "@/components/PriceSizeIndexReview";
import { getPriceSizeIndexReview, priceSizeIndexPayload, priceSizeIndexCsvText, priceSizeIndexSchema } from "@/lib/references/priceSizeIndex";
import { GET as jsonGET } from "@/app/datasets/doll-price-size-review.json/route";
import { GET as csvGET } from "@/app/datasets/doll-price-size-review.csv/route";

afterEach(() => vi.unstubAllEnvs());

test.each(["production", "development", ""])("review is unavailable in %s", async mode => {
  vi.stubEnv("VERCEL_ENV", mode);
  expect(getPriceSizeIndexReview()).toBeNull();
  expect(priceSizeIndexPayload()).toBeNull();
  expect(priceSizeIndexCsvText()).toBeNull();
  expect(priceSizeIndexSchema()).toBeNull();
  expect(renderToStaticMarkup(<PriceSizeIndexReview />)).toBe("");
  for (const response of [jsonGET(), csvGET()]) {
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
  }
});

test("unset server environment cannot be enabled by public environment hint", () => {
  vi.stubEnv("VERCEL_ENV", undefined);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
  expect(getPriceSizeIndexReview()).toBeNull();
});

test("snapshot coverage and band counts reconcile", () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  const data = getPriceSizeIndexReview()!;
  expect(data.snapshotAt).toBe("2026-10-23T03:03:26.912Z");
  expect(data.sourceRecordCount).toBe(3526);
  expect(data.includedListingCount + data.excludedListingCount).toBe(data.sourceRecordCount);
  expect(data.heightBands.reduce((n,b) => n + b.listingCount, 0)).toBe(data.includedListingCount);
  expect(data.summary).toMatchObject({ currency: "USD", medianListedBasePrice: 1899, middleHalfListedBasePrice: [1699,2299], medianListedHeightCm: 163, middleHalfListedHeightCm: [158,166] });
  expect(data.verifiedUniqueFactoryModels).toBeNull();
  expect(data.weightStatistics).toBeNull();
});

test("CSV and JSON expose matching aggregates and no record-level audit fields", async () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  const json = jsonGET();
  const csv = csvGET();
  expect(json.status).toBe(200);
  expect(csv.status).toBe(200);
  const payload = await json.json();
  const text = await csv.text();
  expect(payload).toEqual(priceSizeIndexPayload());
  expect(text).toBe(priceSizeIndexCsvText());
  expect(text.trim().split("\n")).toHaveLength(6);
  expect(text).toContain("USD,160 to under165cm,969,1899,162");
  for (const response of [json,csv]) {
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("cache-control")).toBe("no-store");
  }
  expect(csv.headers.get("content-disposition")).toContain("2026-10-23.csv");
  expect(payload).not.toHaveProperty("license");
  for (const forbidden of ["gid://shopify", "snapshot.private", "heuristicIdentityKey", "sourceTitle", "holdTags", "featuredImage", "302 physical models"]) {
    expect(JSON.stringify(payload)).not.toContain(forbidden);
  }
});

test("Dataset describes only the new draft's visible price/height data", () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  const schema = priceSizeIndexSchema()!;
  expect(schema["@type"]).toBe("Dataset");
  expect(schema.url).toBe("https://dollwow.com/learn/sex-doll-size-weight-guide#october-price-height-review");
  expect(schema.temporalCoverage).toBe("2026-10-23");
  expect(schema.dateModified).toBe(getPriceSizeIndexReview()!.snapshotAt);
  expect(schema.distribution.map(d=>d.encodingFormat)).toEqual(["application/json","text/csv"]);
  expect(schema.variableMeasured.join(" ")).not.toContain("weight");
  expect(schema).not.toHaveProperty("license");
  expect(schema).not.toHaveProperty("datePublished");
});

test("initial HTML has numeric table, download links and native methodology disclosure", () => {
  vi.stubEnv("VERCEL_ENV", "preview");
  const html = renderToStaticMarkup(<PriceSizeIndexReview />);
  expect(html).toContain("review draft");
  expect(html).toContain("3,098");
  expect(html).toContain("US$1,899");
  expect(html).toContain("unique factory-model count is unknown");
  expect(html).toContain("<table");
  expect(html).toContain("<details");
  expect(html).toContain('href="/datasets/doll-price-size-review.csv"');
  expect(html).toContain('href="/datasets/doll-price-size-review.json"');
  expect(html).toContain('tabindex="0"');
  expect(html).not.toContain("<h1");
  expect(html).not.toContain('"@type":"Product"');
  expect(html).not.toContain('"@type":"Offer"');
  expect(html).not.toContain("supply proof");
});

test("historical August dataset and review date are retained", () => {
  const historical = JSON.parse(fs.readFileSync("content/learn/sex-doll-size-weight-index.json", "utf8"));
  const markdown = fs.readFileSync("content/learn/drafts/sex-doll-size-weight-guide.md", "utf8");
  expect(historical.methodology.analyzedListings).toBe(2615);
  expect(historical.generatedAt).toBe("2026-08-12T05:47:31.243Z");
  expect(markdown).toContain('lastReviewed: "2026-08-12"');
  expect(markdown).not.toContain("1,899");
});
