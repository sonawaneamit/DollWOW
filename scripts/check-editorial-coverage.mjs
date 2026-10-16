#!/usr/bin/env node
/**
 * Check editorial coverage for FunWest and Top Fire listings
 * Identifies which products are missing editorial sections
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fs from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2026-04";

if (!SHOPIFY_STORE || !ADMIN_TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN");
  process.exit(1);
}

async function shopifyAdminFetch(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

async function getProductsByVendor(vendor) {
  const products = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const query = `
      query GetProducts($vendor: String!, $cursor: String) {
        products(first: 50, after: $cursor, query: $vendor) {
          edges {
            cursor
            node {
              id
              title
              handle
              vendor
              status
              featuredImage {
                url
              }
              images(first: 1) {
                nodes {
                  url
                }
              }
              metafields(first: 50, namespace: "custom") {
                nodes {
                  key
                  value
                  type
                }
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const data = await shopifyAdminFetch(query, { vendor: `vendor:${vendor}`, cursor });
    
    for (const edge of data.products.edges) {
      products.push(edge.node);
      cursor = edge.cursor;
    }

    hasNext = data.products.pageInfo.hasNextPage;
  }

  return products;
}

function getMetafieldValue(product, key) {
  const metafield = product.metafields?.nodes?.find(m => m.key === key);
  return metafield?.value || null;
}

function checkEditorial(product) {
  const editorial = getMetafieldValue(product, "editorial_intro");
  
  if (!editorial) {
    return { status: "missing", reason: "No editorial_intro metafield" };
  }

  try {
    const parsed = JSON.parse(editorial);
    
    if (!parsed.eyebrow || !parsed.heading || !parsed.paragraph) {
      return { 
        status: "incomplete",
        reason: "Missing fields",
        details: {
          hasEyebrow: Boolean(parsed.eyebrow),
          hasHeading: Boolean(parsed.heading),
          hasParagraph: Boolean(parsed.paragraph)
        }
      };
    }

    // Check for SKU/code issues
    const text = `${parsed.eyebrow} ${parsed.heading} ${parsed.paragraph}`;
    const issues = [];
    
    if (/F[SW]D\d{3,}/i.test(text) || /DOL-\d+/i.test(text)) {
      issues.push("Contains factory SKU");
    }
    
    if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(text)) {
      issues.push("Contains head code");
    }

    const wordCount = parsed.paragraph.split(/\s+/).length;
    
    return {
      status: issues.length > 0 ? "has_issues" : "ok",
      wordCount,
      issues: issues.length > 0 ? issues : undefined
    };
  } catch (e) {
    return { status: "invalid", reason: "JSON parse error", error: e.message };
  }
}

async function main() {
  console.log("Checking Editorial Coverage for FunWest and Top Fire");
  console.log("=".repeat(80));

  const brands = {
    funwest: { vendor: "FunWest Doll", name: "FunWest Dolls" },
    topfire: { vendor: "Top Fire Doll", name: "Top Fire Doll" }
  };

  const results = {};
  const missing = {};

  for (const [key, brand] of Object.entries(brands)) {
    console.log(`\nFetching ${brand.name} products...`);
    const products = await getProductsByVendor(brand.vendor);
    console.log(`Found ${products.length} products`);

    const stats = {
      ok: [],
      missing: [],
      incomplete: [],
      has_issues: [],
      invalid: []
    };

    for (const product of products) {
      const result = checkEditorial(product);
      stats[result.status].push({
        handle: product.handle,
        title: product.title,
        ...result
      });
    }

    results[key] = {
      total: products.length,
      stats: {
        ok: stats.ok.length,
        missing: stats.missing.length,
        incomplete: stats.incomplete.length,
        has_issues: stats.has_issues.length,
        invalid: stats.invalid.length
      },
      details: stats
    };

    missing[key] = [...stats.missing, ...stats.incomplete, ...stats.invalid]
      .map(p => ({ handle: p.handle, title: p.title, reason: p.reason }));

    console.log(`\n${brand.name} Editorial Coverage:`);
    console.log(`  Total products: ${products.length}`);
    console.log(`  ✓ OK: ${stats.ok.length}`);
    console.log(`  ✗ Missing: ${stats.missing.length}`);
    console.log(`  ⚠ Incomplete: ${stats.incomplete.length}`);
    console.log(`  ⚠ Has issues: ${stats.has_issues.length}`);
    console.log(`  ✗ Invalid JSON: ${stats.invalid.length}`);
    console.log(`\n  TOTAL NEED EDITORIAL: ${stats.missing.length + stats.incomplete.length + stats.invalid.length}`);
  }

  // Save results
  const outputPath = resolve(ROOT, "editorial-coverage-report.json");
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to: ${outputPath}`);

  // Save missing list for generation
  const missingPath = resolve(ROOT, "editorial-missing-list.json");
  await fs.writeFile(missingPath, JSON.stringify(missing, null, 2));
  console.log(`Missing editorial list saved to: ${missingPath}`);

  // Summary
  const totalMissing = 
    (results.funwest.stats.missing + results.funwest.stats.incomplete + results.funwest.stats.invalid) +
    (results.topfire.stats.missing + results.topfire.stats.incomplete + results.topfire.stats.invalid);

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total listings: ${results.funwest.total + results.topfire.total}`);
  console.log(`✓ Complete editorial: ${results.funwest.stats.ok + results.topfire.stats.ok}`);
  console.log(`✗ MISSING/NEED EDITORIAL: ${totalMissing}`);
  console.log("\n⚠️ CRITICAL: Every listing must have complete editorial before going live.");
}

main().catch(console.error);
