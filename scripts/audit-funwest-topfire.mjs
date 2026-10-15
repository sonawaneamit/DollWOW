#!/usr/bin/env node
/**
 * Audit FunWest and Top Fire listings against the DollWOW standard
 * Identifies issues that need fixing before listings can go live
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

const BRANDS = {
  funwest: { name: "FunWest Dolls", correctName: "FunWest Dolls", vendor: "FunWest Doll" },
  topfire: { name: "Top Fire Doll", correctName: "Top Fire Doll", vendor: "Top Fire Doll" }
};

const issues = [];

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
              tags
              status
              images(first: 15) {
                nodes {
                  url
                  altText
                }
              }
              metafields(first: 50) {
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

function getMetafieldValue(product, namespace, key) {
  const metafield = product.metafields?.nodes?.find(
    m => m.namespace === namespace && m.key === key
  );
  return metafield?.value || null;
}

function checkTitle(product, brandInfo) {
  const issues = [];
  const title = product.title;

  // Check for SKU codes in title
  if (/F[SW]D\d{3,}/i.test(title) || /DOL-\d+/i.test(title)) {
    issues.push({
      type: "title_has_sku",
      severity: "high",
      message: "Title contains factory SKU code",
      details: { title, pattern: "FSD/FWD/DOL pattern detected" }
    });
  }

  // Check for head codes in title
  if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(title)) {
    issues.push({
      type: "title_has_head_code",
      severity: "high",
      message: "Title contains head model code",
      details: { title }
    });
  }

  // Check for incorrect brand name
  if (brandInfo.vendor !== brandInfo.correctName) {
    if (title.includes(brandInfo.vendor) && !title.includes(brandInfo.correctName)) {
      issues.push({
        type: "incorrect_brand_name",
        severity: "medium",
        message: `Brand name should be "${brandInfo.correctName}"`,
        details: { title, found: brandInfo.vendor, expected: brandInfo.correctName }
      });
    }
  }

  return issues;
}

function checkIntroDescription(product) {
  const issues = [];
  const intro = getMetafieldValue(product, "custom", "intro_description");
  
  if (!intro) return issues;

  // Check for SKU codes
  if (/F[SW]D\d{3,}/i.test(intro) || /factory\s+SKU/i.test(intro)) {
    issues.push({
      type: "intro_has_sku",
      severity: "high",
      message: "Intro paragraph contains factory SKU",
      details: { intro: intro.substring(0, 200) }
    });
  }

  // Check for head codes
  if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(intro)) {
    issues.push({
      type: "intro_has_head_code",
      severity: "high",
      message: "Intro paragraph contains head model code",
      details: { intro: intro.substring(0, 200) }
    });
  }

  // Check for "White skin" or similar internal descriptions
  if (/\b(white|tan|natural)\s+skin\b/i.test(intro)) {
    issues.push({
      type: "intro_has_skin_code",
      severity: "medium",
      message: "Intro contains internal skin color description",
      details: { intro: intro.substring(0, 200) }
    });
  }

  return issues;
}

function checkHeadModel(product) {
  const issues = [];
  const headModel = getMetafieldValue(product, "custom", "head_model");
  
  if (!headModel) return issues;

  // Check for "Head #036SJ" pattern
  if (/^Head\s*#\s*\d+[A-Z]+$/i.test(headModel.trim())) {
    issues.push({
      type: "head_model_has_prefix",
      severity: "medium",
      message: "Head model shows supplier code with 'Head #' prefix",
      details: { headModel, suggestion: "Remove 'Head #' prefix or use descriptive name" }
    });
  }

  return issues;
}

function checkEditorial(product) {
  const issues = [];
  const editorial = getMetafieldValue(product, "custom", "editorial_intro");
  
  // CRITICAL: Editorial is required on EVERY listing
  if (!editorial) {
    issues.push({
      type: "missing_editorial",
      severity: "critical",
      message: "⚠️ CRITICAL: Missing editorial section - listing FAILS",
      details: { note: "Owner requirement: EVERY listing must have editorial story text" }
    });
    return issues;
  }

  try {
    const parsed = JSON.parse(editorial);
    
    // All three fields must be present and non-empty
    if (!parsed.eyebrow || !parsed.heading || !parsed.paragraph) {
      issues.push({
        type: "incomplete_editorial",
        severity: "critical",
        message: "⚠️ CRITICAL: Editorial section incomplete - listing FAILS",
        details: { 
          hasEyebrow: Boolean(parsed.eyebrow),
          hasHeading: Boolean(parsed.heading),
          hasParagraph: Boolean(parsed.paragraph),
          note: "All three fields required: eyebrow, heading, paragraph"
        }
      });
    }

    // Check for SKU codes in editorial
    const editorialText = [parsed.eyebrow, parsed.heading, parsed.paragraph].join(" ");
    if (/F[SW]D\d{3,}/i.test(editorialText) || /DOL-\d+/i.test(editorialText)) {
      issues.push({
        type: "editorial_has_sku",
        severity: "critical",
        message: "⚠️ CRITICAL: Editorial contains factory SKU code",
        details: { note: "Must use doll's real name, not SKU" }
      });
    }

    // Check for head codes in editorial
    if (/head\s*#?\s*\d+[A-Z]{2,}/i.test(editorialText) || /\d{3}[A-Z]{2,}/i.test(editorialText)) {
      issues.push({
        type: "editorial_has_head_code",
        severity: "critical",
        message: "⚠️ CRITICAL: Editorial contains head model code",
        details: { note: "Must use descriptive language, not factory codes" }
      });
    }

    // Check word count
    if (parsed.paragraph) {
      const wordCount = parsed.paragraph.split(/\s+/).length;
      if (wordCount < 90 || wordCount > 130) {
        issues.push({
          type: "editorial_word_count",
          severity: "medium",
          message: "Editorial paragraph word count outside 90-130 range",
          details: { wordCount, target: "90-130 words" }
        });
      }
    }
  } catch (e) {
    issues.push({
      type: "invalid_editorial_json",
      severity: "critical",
      message: "⚠️ CRITICAL: Editorial JSON is malformed",
      details: { error: e.message }
    });
  }

  return issues;
}

function checkGallery(product) {
  const issues = [];
  const images = product.images?.nodes || [];
  
  if (images.length === 0) {
    issues.push({
      type: "no_images",
      severity: "critical",
      message: "Product has no images",
      details: {}
    });
    return issues;
  }

  // Check for logo as first image
  const firstImage = images[0];
  if (firstImage && (
    /logo/i.test(firstImage.url) ||
    /logo/i.test(firstImage.altText || "") ||
    /brand.*poster/i.test(firstImage.url)
  )) {
    issues.push({
      type: "logo_first_image",
      severity: "high",
      message: "First image appears to be logo/brand poster",
      details: { url: firstImage.url }
    });
  }

  // Check gallery size
  if (images.length < 8) {
    issues.push({
      type: "gallery_too_small",
      severity: "medium",
      message: `Gallery has only ${images.length} images (typical: 8-12)`,
      details: { count: images.length, recommended: "8-12" }
    });
  } else if (images.length > 15) {
    issues.push({
      type: "gallery_too_large",
      severity: "medium",
      message: `Gallery has ${images.length} images (typical: 8-12)`,
      details: { count: images.length, recommended: "8-12" }
    });
  }

  // Check for measurement chart images
  const chartImages = images.filter(img => 
    /chart|spec|measure|dimension/i.test(img.altText || "") ||
    /chart|spec|measure|dimension/i.test(img.url)
  );
  
  if (chartImages.length > 0) {
    issues.push({
      type: "chart_in_gallery",
      severity: "medium",
      message: "Measurement chart detected in gallery",
      details: { count: chartImages.length, note: "Charts belong in specs section" }
    });
  }

  return issues;
}

function checkStatus(product) {
  const issues = [];
  
  // Check if it's a draft (should be ACTIVE for preview branches)
  if (product.status !== "ACTIVE") {
    issues.push({
      type: "not_active",
      severity: "low",
      message: `Product status is ${product.status} (should be ACTIVE)`,
      details: { status: product.status }
    });
  }

  // Check for dollwow-test tag
  if (!product.tags.includes("dollwow-test")) {
    issues.push({
      type: "missing_test_tag",
      severity: "high",
      message: "Missing dollwow-test tag (required for preview)",
      details: { tags: product.tags }
    });
  }

  return issues;
}

async function auditProduct(product, brandInfo) {
  const productIssues = [];

  productIssues.push(...checkTitle(product, brandInfo));
  productIssues.push(...checkIntroDescription(product));
  productIssues.push(...checkHeadModel(product));
  productIssues.push(...checkEditorial(product));
  productIssues.push(...checkGallery(product));
  productIssues.push(...checkStatus(product));

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    status: product.status,
    issues: productIssues
  };
}

async function main() {
  console.log("=".repeat(80));
  console.log("DollWOW Listing Standard Audit");
  console.log("FunWest Dolls and Top Fire Doll");
  console.log("=".repeat(80));
  console.log();

  const results = { funwest: [], topfire: [] };

  for (const [key, brandInfo] of Object.entries(BRANDS)) {
    console.log(`\nFetching ${brandInfo.name} products...`);
    const products = await getProductsByVendor(brandInfo.vendor);
    console.log(`Found ${products.length} products`);

    console.log(`Auditing ${brandInfo.name} products...`);
    for (const product of products) {
      const result = await auditProduct(product, brandInfo);
      results[key].push(result);
    }
  }

  // Generate report
  console.log("\n" + "=".repeat(80));
  console.log("AUDIT RESULTS");
  console.log("=".repeat(80));

  for (const [key, brandInfo] of Object.entries(BRANDS)) {
    const brandResults = results[key];
    const totalProducts = brandResults.length;
    const productsWithIssues = brandResults.filter(r => r.issues.length > 0).length;
    const totalIssues = brandResults.reduce((sum, r) => sum + r.issues.length, 0);

    console.log(`\n${brandInfo.name}:`);
    console.log(`  Total products: ${totalProducts}`);
    console.log(`  Products with issues: ${productsWithIssues}`);
    console.log(`  Total issues: ${totalIssues}`);

    // Issue breakdown by severity
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const byType = {};

    for (const result of brandResults) {
      for (const issue of result.issues) {
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
        byType[issue.type] = (byType[issue.type] || 0) + 1;
      }
    }

    console.log(`\n  By severity:`);
    console.log(`    Critical: ${bySeverity.critical}`);
    console.log(`    High: ${bySeverity.high}`);
    console.log(`    Medium: ${bySeverity.medium}`);
    console.log(`    Low: ${bySeverity.low}`);

    console.log(`\n  Top issues:`);
    const sortedTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [type, count] of sortedTypes) {
      console.log(`    ${type}: ${count}`);
    }
  }

  // Save detailed results
  const outputPath = resolve(ROOT, "funwest-topfire-audit-results.json");
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);

  // Generate issues list for fixes
  const issuesList = [];
  for (const [key, brandResults] of Object.entries(results)) {
    for (const result of brandResults) {
      if (result.issues.length > 0) {
        issuesList.push({
          brand: key,
          handle: result.handle,
          title: result.title,
          issueCount: result.issues.length,
          issues: result.issues
        });
      }
    }
  }

  const issuesPath = resolve(ROOT, "funwest-topfire-issues.json");
  await fs.writeFile(issuesPath, JSON.stringify(issuesList, null, 2));
  console.log(`Issues list saved to: ${issuesPath}`);

  console.log("\n" + "=".repeat(80));
  console.log("AUDIT COMPLETE");
  console.log("=".repeat(80));
}

main().catch(console.error);
