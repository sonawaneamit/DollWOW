#!/usr/bin/env node
/**
 * Fix FunWest/Top Fire data issues:
 * - Remove SKU codes from titles and intro descriptions
 * - Strip "Head #" prefix from head_model
 * - Fix brand name consistency
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

async function loadLocalEnv() {
  try {
    const envLocal = await fs.readFile(path.resolve(ROOT, ".env.local"), "utf-8");
    for (const line of envLocal.split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch (e) {}
}

await loadLocalEnv();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2026-04";
const EXECUTE = process.argv.includes("--execute");

if (!EXECUTE) {
  console.log("DRY RUN MODE. Add --execute to apply changes.");
}

async function adminFetch(query, variables = {}) {
  const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.errors) {
    console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2));
    throw new Error("GraphQL query failed");
  }
  
  return data.data;
}

async function getProducts(vendor) {
  const products = [];
  let hasNext = true;
  let cursor = null;

  while (hasNext) {
    const data = await adminFetch(`
      query($vendor: String!, $cursor: String) {
        products(first: 50, after: $cursor, query: $vendor) {
          edges {
            cursor
            node {
              id
              title
              handle
              metafields(first: 100, namespace: "custom") {
                nodes {
                  id
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
    `, { vendor: `vendor:"${vendor}"`, cursor });
    
    for (const edge of data.products.edges) {
      products.push(edge.node);
      cursor = edge.cursor;
    }

    hasNext = data.products.pageInfo.hasNextPage;
  }

  return products;
}

function cleanTitle(title) {
  // Remove SKU codes (FSD052, FWD041, DOL-161 patterns)
  let cleaned = title.replace(/\s+F[SW]D\d{3,}\b/gi, "");
  cleaned = cleaned.replace(/\s+DOL-\d+\b/gi, "");
  // Remove head codes (Head #036SJ patterns)
  cleaned = cleaned.replace(/\s+Head\s*#\s*\d+[A-Z]+/gi, "");
  // Fix brand name
  cleaned = cleaned.replace(/FunWest Doll\b/gi, "FunWest Dolls");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function cleanIntro(intro) {
  if (!intro) return null;
  // Remove "factory SKU FSD052" patterns
  let cleaned = intro.replace(/factory\s+SKU\s+F[SW]D\d{3,}/gi, "");
  cleaned = cleaned.replace(/SKU\s+F[SW]D\d{3,}/gi, "");
  cleaned = cleaned.replace(/SKU:\s*F[SW]D\d{3,}/gi, "");
  cleaned = cleaned.replace(/\(F[SW]D\d{3,}\)/gi, "");
  // Remove head codes
  cleaned = cleaned.replace(/head\s+#?\s*\d+[A-Z]{2,}/gi, "head");
  cleaned = cleaned.replace(/,\s*head\s+\d+[A-Z]{2,}/gi, "");
  // Remove skin color descriptions
  cleaned = cleaned.replace(/,\s*(White|Tan|Natural)\s+skin\b/gi, "");
  cleaned = cleaned.replace(/\s+with\s+(White|Tan|Natural)\s+skin\b/gi, "");
  // Clean up multiple spaces and commas
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function cleanHeadModel(headModel) {
  if (!headModel) return null;
  // Remove "Head #" prefix
  let cleaned = headModel.replace(/^Head\s*#\s*/i, "");
  return cleaned;
}

async function updateProduct(productId, title, metafieldsToUpdate) {
  if (!EXECUTE) {
    console.log(`  Would update: ${productId}`);
    if (title) console.log(`    Title: ${title}`);
    for (const mf of metafieldsToUpdate) {
      console.log(`    ${mf.key}: ${mf.value?.substring(0, 100)}...`);
    }
    return { success: true };
  }

  const mutations = [];
  
  // Update title if needed
  if (title) {
    mutations.push({
      query: `
        mutation($id: ID!, $title: String!) {
          productUpdate(input: { id: $id, title: $title }) {
            product { id title }
            userErrors { field message }
          }
        }
      `,
      variables: { id: productId, title }
    });
  }

  // Update metafields
  for (const mf of metafieldsToUpdate) {
    mutations.push({
      query: `
        mutation($id: ID!, $metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id key value }
            userErrors { field message }
          }
        }
      `,
      variables: {
        id: productId,
        metafields: [{
          ownerId: productId,
          namespace: mf.namespace,
          key: mf.key,
          value: mf.value,
          type: mf.type
        }]
      }
    });
  }

  for (const mutation of mutations) {
    await adminFetch(mutation.query, mutation.variables);
    await new Promise(r => setTimeout(r, 300)); // Rate limit
  }

  return { success: true };
}

async function main() {
  console.log("Fetching FunWest products...");
  const funwestProducts = await getProducts("FunWest Doll");
  console.log(`Found ${funwestProducts.length} FunWest products`);

  console.log("\nFetching Top Fire products...");
  const topfireProducts = await getProducts("Top Fire Doll");
  console.log(`Found ${topfireProducts.length} Top Fire products`);

  const allProducts = [...funwestProducts, ...topfireProducts];
  
  let changesCount = 0;
  
  for (const product of allProducts) {
    const changes = [];
    const metafieldsToUpdate = [];
    
    // Check title
    const cleanedTitle = cleanTitle(product.title);
    if (cleanedTitle !== product.title) {
      changes.push(`Title: "${product.title}" → "${cleanedTitle}"`);
    }
    
    // Check metafields
    for (const mf of product.metafields.nodes) {
      if (mf.key === "intro_description") {
        const cleaned = cleanIntro(mf.value);
        if (cleaned && cleaned !== mf.value) {
          changes.push(`Intro: Removed SKU/codes`);
          metafieldsToUpdate.push({
            namespace: mf.namespace,
            key: mf.key,
            value: cleaned,
            type: mf.type
          });
        }
      } else if (mf.key === "head_model") {
        const cleaned = cleanHeadModel(mf.value);
        if (cleaned && cleaned !== mf.value) {
          changes.push(`Head model: "${mf.value}" → "${cleaned}"`);
          metafieldsToUpdate.push({
            namespace: mf.namespace,
            key: mf.key,
            value: cleaned,
            type: mf.type
          });
        }
      }
    }
    
    if (changes.length > 0) {
      console.log(`\n${product.handle}:`);
      for (const change of changes) {
        console.log(`  ${change}`);
      }
      
      await updateProduct(
        product.id,
        cleanedTitle !== product.title ? cleanedTitle : null,
        metafieldsToUpdate
      );
      
      changesCount++;
    }
  }
  
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Total products processed: ${allProducts.length}`);
  console.log(`Products with changes: ${changesCount}`);
  
  if (!EXECUTE) {
    console.log(`\n⚠️ DRY RUN - No changes made. Run with --execute to apply.`);
  } else {
    console.log(`\n✅ Changes applied to Shopify.`);
  }
}

main().catch(console.error);
