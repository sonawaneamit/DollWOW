import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
const query = `{ product(handle: "dolls-castle-chiku-sz25-160cm-q-cup-silicone-character-doll") {
  id handle title description tags
  variants(first: 10) { nodes { id availableForSale price { amount currencyCode } } }
  images(first: 50) { nodes { id url } }
  metafield(namespace: "custom", key: "customization_groups") { value }
} }`;
const response = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
  body: JSON.stringify({ query })
});
const result = await response.json();
if (!response.ok || result.errors || !result.data?.product) throw Error("Source read failed");
const output = "data/exports/dol-313-2026-10-29";
await mkdir(output, { recursive: true });
const product = result.data.product;
await writeFile(`${output}/source-product.json`, JSON.stringify({ at: new Date().toISOString(), product }, null, 2));
console.log(JSON.stringify({ id: product.id, menuSha256: createHash("sha256").update(product.metafield.value).digest("hex"), groups: JSON.parse(product.metafield.value).length, variants: product.variants.nodes.length, images: product.images.nodes.length }));
