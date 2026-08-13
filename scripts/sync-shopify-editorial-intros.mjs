#!/usr/bin/env node

import fs from "node:fs/promises";

const API_VERSION = "2026-04";
const input = process.argv.includes("--input")
  ? process.argv[process.argv.indexOf("--input") + 1]
  : "data/exports/pdp-phase/full-body-editorial-approved-v6.json";
const execute = process.argv.includes("--execute");
const expectedCount = Number(process.env.PDP_EDITORIAL_EXPECTED_COUNT || 2702);
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const payload = JSON.parse(await fs.readFile(input, "utf8"));
const records = Array.isArray(payload.records) ? payload.records : [];
if (records.length !== expectedCount) {
  throw new Error(`Refusing sync: expected ${expectedCount} approved records, found ${records.length}.`);
}
if (new Set(records.map((record) => record.handle)).size !== records.length) {
  throw new Error("Refusing sync: duplicate product handles found in approved artifact.");
}

console.log(`${execute ? "Executing" : "Dry run for"} ${records.length} approved editorial introductions from ${input}.`);
console.log(`Sample: ${records.slice(0, 3).map((record) => `${record.handle}: ${record.heading}`).join(" | ")}`);
if (!execute) {
  console.log("Dry run only. Add --execute after reviewing the approved and held artifacts.");
  process.exit(0);
}
if (!domain || !token) throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are required.");

const productsByHandle = new Map();
let cursor = null;
do {
  const data = await adminFetch(
    `query EditorialProductIds($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id handle }
      }
    }`,
    { first: 250, after: cursor }
  );
  for (const product of data.products.nodes) productsByHandle.set(product.handle, product.id);
  cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
} while (cursor);

const missing = records.filter((record) => !productsByHandle.has(record.handle));
if (missing.length) throw new Error(`Refusing sync: ${missing.length} approved products are missing from Shopify. First: ${missing[0].handle}`);

for (let offset = 0; offset < records.length; offset += 25) {
  const batch = records.slice(offset, offset + 25);
  const metafields = batch.map((record) => ({
    ownerId: productsByHandle.get(record.handle),
    namespace: "custom",
    key: "editorial_intro",
    type: "json",
    value: JSON.stringify({
      eyebrow: record.eyebrow,
      heading: record.heading,
      paragraph: record.paragraph,
      promptVersion: record.promptVersion,
      generatedAt: record.generatedAt,
    }),
  }));
  const data = await adminFetch(
    `mutation SetEditorialIntros($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { ownerType namespace key }
        userErrors { field message code }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`Shopify rejected batch ${offset + 1}-${offset + batch.length}: ${JSON.stringify(errors)}`);
  console.log(`Synced ${Math.min(offset + batch.length, records.length)}/${records.length}`);
}

async function adminFetch(query, variables) {
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(body.errors?.[0]?.message || `Shopify returned ${response.status}`);
  return body.data;
}
