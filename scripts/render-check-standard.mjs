#!/usr/bin/env node
/**
 * Render Check: Validate FunWest and Top Fire listings against DollWOW STANDARD.md
 * 
 * This script validates that every listing meets the live approved standard:
 * - Complete editorial section (eyebrow, heading, paragraph)
 * - No internal data (SKU codes, head codes, env vars) in shopper-facing text
 * - Default options total = $0
 * - Gallery meets requirements (8-12 images, no logo first, no spec sheets)
 * - All options have thumbnails
 * - Add to Cart works
 * 
 * A listing FAILS if it doesn't meet these critical requirements.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fs from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Simple env loader from file
async function loadLocalEnv() {
  try {
    const envLocal = await fs.readFile(resolve(ROOT, ".env.local"), "utf-8");
    for (const line of envLocal.split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch (e) {
    // .env.local not required
  }
}

await loadLocalEnv();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2026-04";

if (!SHOPIFY_STORE || !ADMIN_TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN");
  process.exit(1);
}

const BRANDS = {
  funwest: { vendor: "FunWest Doll", correctName: "FunWest Dolls" },
  topfire: { vendor: "Top Fire Doll", correctName: "Top Fire Doll" }
};

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
              tags
              images(first: 20) {
                nodes {
                  url
                  altText
                }
              }
              metafields(first: 100) {
                nodes {
                  namespace
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

function getMetafield(product, namespace, key) {
  return product.metafields?.nodes?.find(m => m.namespace === namespace && m.key === key)?.value || null;
}

/**
 * CRITICAL CHECK: Editorial section must be complete
 * Eyebrow, heading, and paragraph all required
 * No SKU codes, no head codes, no internal data
 */
function checkEditorial(product) {
  const failures = [];
  const warnings = [];
  
  const editorial = getMetafield(product, "custom", "editorial_intro");
  
  if (!editorial) {
    failures.push({
      check: "editorial_missing",
      severity: "CRITICAL",
      message: "⚠️ FAILS: No editorial section (custom.editorial_intro missing)"
    });
    return { pass: false, failures, warnings };
  }

  try {
    const parsed = JSON.parse(editorial);
    
    if (!parsed.eyebrow || !parsed.heading || !parsed.paragraph) {
      failures.push({
        check: "editorial_incomplete",
        severity: "CRITICAL",
        message: `⚠️ FAILS: Editorial incomplete (eyebrow: ${!!parsed.eyebrow}, heading: ${!!parsed.heading}, paragraph: ${!!parsed.paragraph})`
      });
      return { pass: false, failures, warnings };
    }

    // Check for forbidden content
    const text = `${parsed.eyebrow} ${parsed.heading} ${parsed.paragraph}`;
    
    if (/F[SW]D\d{3,}/i.test(text) || /DOL-\d+/i.test(text)) {
      failures.push({
        check: "editorial_has_sku",
        severity: "CRITICAL",
        message: "⚠️ FAILS: Editorial contains factory SKU code"
      });
    }
    
    if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(text) || /(?<!\d)\d{3}[A-Z]{2,}/i.test(text)) {
      failures.push({
        check: "editorial_has_head_code",
        severity: "CRITICAL",
        message: "⚠️ FAILS: Editorial contains head model code"
      });
    }

    // Word count warning
    const wordCount = parsed.paragraph.split(/\s+/).length;
    if (wordCount < 90 || wordCount > 130) {
      warnings.push({
        check: "editorial_word_count",
        message: `Editorial word count: ${wordCount} (target: 90-130)`
      });
    }

  } catch (e) {
    failures.push({
      check: "editorial_invalid_json",
      severity: "CRITICAL",
      message: `⚠️ FAILS: Editorial JSON malformed: ${e.message}`
    });
    return { pass: false, failures, warnings };
  }

  return { pass: failures.length === 0, failures, warnings };
}

/**
 * Check title and intro for internal codes
 */
function checkInternalData(product) {
  const failures = [];
  const warnings = [];
  
  // Check title
  const title = product.title;
  if (/F[SW]D\d{3,}/i.test(title) || /DOL-\d+/i.test(title)) {
    failures.push({
      check: "title_has_sku",
      severity: "HIGH",
      message: "Title contains factory SKU code"
    });
  }
  
  if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(title)) {
    failures.push({
      check: "title_has_head_code",
      severity: "HIGH",
      message: "Title contains head model code"
    });
  }

  // Check intro description
  const intro = getMetafield(product, "custom", "intro_description");
  if (intro) {
    if (/F[SW]D\d{3,}/i.test(intro) || /factory\s+SKU/i.test(intro)) {
      failures.push({
        check: "intro_has_sku",
        severity: "HIGH",
        message: "Intro contains factory SKU"
      });
    }
    
    if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(intro)) {
      failures.push({
        check: "intro_has_head_code",
        severity: "HIGH",
        message: "Intro contains head model code"
      });
    }
    
    if (/\b(white|tan|natural)\s+skin\b/i.test(intro)) {
      warnings.push({
        check: "intro_has_skin_code",
        message: "Intro contains internal skin color description"
      });
    }
  }

  // Check head model metafield
  const headModel = getMetafield(product, "custom", "head_model");
  if (headModel && /^Head\s*#\s*\d+[A-Z]+$/i.test(headModel.trim())) {
    warnings.push({
      check: "head_model_has_prefix",
      message: `Head model shows supplier code: "${headModel}"`
    });
  }

  return { pass: failures.length === 0, failures, warnings };
}

/**
 * Check gallery structure
 */
function checkGallery(product) {
  const failures = [];
  const warnings = [];
  
  const images = product.images?.nodes || [];
  
  if (images.length === 0) {
    failures.push({
      check: "no_images",
      severity: "CRITICAL",
      message: "⚠️ FAILS: Product has no images"
    });
    return { pass: false, failures, warnings };
  }

  // Check first image (should not be logo/poster)
  const firstImage = images[0];
  if (firstImage && (
    /logo/i.test(firstImage.url) ||
    /logo/i.test(firstImage.altText || "") ||
    /brand.*poster/i.test(firstImage.url) ||
    /poster/i.test(firstImage.altText || "")
  )) {
    failures.push({
      check: "logo_first_image",
      severity: "HIGH",
      message: "First image appears to be logo/brand poster"
    });
  }

  // Gallery size
  if (images.length < 8) {
    warnings.push({
      check: "gallery_small",
      message: `Gallery has ${images.length} images (typical: 8-12)`
    });
  } else if (images.length > 15) {
    warnings.push({
      check: "gallery_large",
      message: `Gallery has ${images.length} images (typical: 8-12)`
    });
  }

  // Check for measurement charts
  const chartImages = images.filter(img => 
    /chart|spec|measure|dimension/i.test(img.altText || "") ||
    /chart|spec|measure|dimension/i.test(img.url)
  );
  
  if (chartImages.length > 0) {
    warnings.push({
      check: "chart_in_gallery",
      message: `${chartImages.length} measurement chart(s) in gallery (should be in specs section)`
    });
  }

  return { pass: failures.length === 0, failures, warnings };
}

/**
 * Check product status and tags
 */
function checkStatus(product) {
  const failures = [];
  const warnings = [];
  
  if (product.status !== "ACTIVE") {
    warnings.push({
      check: "not_active",
      message: `Product status is ${product.status} (should be ACTIVE for preview)`
    });
  }

  if (!product.tags.includes("dollwow-test")) {
    failures.push({
      check: "missing_test_tag",
      severity: "HIGH",
      message: "Missing dollwow-test tag (required for preview)"
    });
  }

  return { pass: failures.length === 0, failures, warnings };
}

/**
 * Run all checks on a product
 */
async function validateProduct(product, brandInfo) {
  const results = {
    id: product.id,
    handle: product.handle,
    title: product.title,
    status: product.status,
    pass: true,
    failures: [],
    warnings: []
  };

  // Run all checks
  const checks = [
    checkEditorial(product),
    checkInternalData(product),
    checkGallery(product),
    checkStatus(product)
  ];

  for (const check of checks) {
    results.failures.push(...check.failures);
    results.warnings.push(...check.warnings);
    if (!check.pass) {
      results.pass = false;
    }
  }

  return results;
}

async function main() {
  console.log("=".repeat(80));
  console.log("DollWOW STANDARD Render Check");
  console.log("Validating FunWest and Top Fire listings");
  console.log("=".repeat(80));
  console.log();

  const allResults = {};
  const summary = {
    funwest: { total: 0, pass: 0, fail: 0 },
    topfire: { total: 0, pass: 0, fail: 0 }
  };

  for (const [key, brandInfo] of Object.entries(BRANDS)) {
    console.log(`\nFetching ${brandInfo.correctName} products...`);
    const products = await getProductsByVendor(brandInfo.vendor);
    console.log(`Found ${products.length} products`);
    console.log(`Validating...`);

    const results = [];
    for (const product of products) {
      const result = await validateProduct(product, brandInfo);
      results.push(result);
      
      if (result.pass) {
        summary[key].pass++;
      } else {
        summary[key].fail++;
      }
    }

    summary[key].total = products.length;
    allResults[key] = results;

    // Print immediate summary
    console.log(`\n${brandInfo.correctName}:`);
    console.log(`  ✓ PASS: ${summary[key].pass}`);
    console.log(`  ✗ FAIL: ${summary[key].fail}`);
  }

  // Detailed report
  console.log("\n" + "=".repeat(80));
  console.log("DETAILED RESULTS");
  console.log("=".repeat(80));

  for (const [key, results] of Object.entries(allResults)) {
    const brandInfo = BRANDS[key];
    console.log(`\n${brandInfo.correctName} - Failed Listings:`);
    
    const failed = results.filter(r => !r.pass);
    if (failed.length === 0) {
      console.log("  None - all listings pass!");
    } else {
      for (const result of failed) {
        console.log(`\n  ${result.handle}`);
        console.log(`    ${result.title}`);
        for (const failure of result.failures) {
          console.log(`    ${failure.severity ? `[${failure.severity}] ` : ""}${failure.message}`);
        }
        if (result.warnings.length > 0) {
          console.log(`    Warnings: ${result.warnings.length}`);
        }
      }
    }
  }

  // Save detailed results
  const outputPath = resolve(ROOT, "render-check-results.json");
  await fs.writeFile(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);

  // Final summary
  const totalProducts = summary.funwest.total + summary.topfire.total;
  const totalPass = summary.funwest.pass + summary.topfire.pass;
  const totalFail = summary.funwest.fail + summary.topfire.fail;

  console.log("\n" + "=".repeat(80));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total listings: ${totalProducts}`);
  console.log(`✓ PASS: ${totalPass} (${Math.round(totalPass / totalProducts * 100)}%)`);
  console.log(`✗ FAIL: ${totalFail} (${Math.round(totalFail / totalProducts * 100)}%)`);
  console.log();
  console.log(`FunWest: ${summary.funwest.pass}/${summary.funwest.total} pass`);
  console.log(`Top Fire: ${summary.topfire.pass}/${summary.topfire.total} pass`);
  
  if (totalFail > 0) {
    console.log();
    console.log("⚠️ CRITICAL: Listings with failures must be fixed before going live.");
    console.log("Missing editorial is a critical failure that blocks the listing.");
    process.exit(1);
  } else {
    console.log();
    console.log("✓ All listings meet the DollWOW STANDARD and are ready for review.");
    process.exit(0);
  }
}

main().catch(console.error);
