import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(ROOT, String(args.input || "data/exports/shopify-rosemary-option-price-sync.json"));
const outputPath = path.resolve(ROOT, String(args.output || "docs/customization-checkout-blockers-2026-08-12.md"));
const report = JSON.parse(await fs.readFile(inputPath, "utf8"));

const products = (report.products || []).map(productAudit);
const blockedProducts = products.filter((product) => product.blockedOptions.length);
const directRosemaryUpdates = (report.products || []).filter((product) => product.status === "changed");
const failedSources = (report.products || []).filter((product) => product.status === "failed");
const unmatchedSources = (report.products || []).filter((product) => product.status === "unmatched" || product.status === "no-price-data");
const brandSummary = summarizeByBrand(blockedProducts);
const generatedAt = new Date().toISOString();

const markdown = `# Customization checkout blockers

Generated: ${generatedAt}

Source snapshot: \`${path.relative(ROOT, inputPath)}\` (${report.generatedAt || "unknown source time"}, ${report.mode || "unknown mode"})

## Why this report exists

The storefront correctly refuses to put an unpriced customization into checkout, but the previous data model treated “no price” as though the factory choice did not exist. That creates a conversion problem: legitimate manufacturer choices can disappear from a PDP, or a customer can reach a message telling them to contact the team instead of checking out.

The application now keeps the complete factory option universe separate from the checkout-safe option set. An option may exist and be displayable or visualizable while still being excluded from online checkout until its incremental price is verified.

## Snapshot

| Check | Count |
|---|---:|
| Rosemary-sourced products checked | ${number(report.checked)} |
| Products Rosemary can update directly from the current source page | ${number(directRosemaryUpdates.length)} |
| Products still containing at least one checkout-blocking option after the Rosemary pass | ${number(blockedProducts.length)} |
| Remaining unpriced factory choices | ${number(blockedProducts.reduce((sum, product) => sum + product.blockedOptions.length, 0))} |
| Source pages that failed | ${number(failedSources.length)} |
| Source pages with no usable match | ${number(unmatchedSources.length)} |

## Recommended remediation order

1. Review and apply the ${number(directRosemaryUpdates.length)}-product Rosemary price-sync artifact. These are not guesses; the dry run found matching option labels and price deltas on the current source pages.
2. Work through the unresolved list below. Check the manufacturer first, then Rosemary, then YourDoll as a temporary dealer reference.
3. Record every verified price as \`priceDelta\`, mark the option \`priceVerified: true\`, and only then allow \`purchasable: true\`.
4. If a source is conflicting or cannot prove the price, keep that option out of checkout. Do not silently mark it included and do not interrupt checkout with “ask our team.”

## Remaining blockers by brand

| Brand | Affected products | Unpriced choices |
|---|---:|---:|
${brandSummary.map(([brand, totals]) => `| ${escapeCell(brand)} | ${number(totals.products)} | ${number(totals.options)} |`).join("\n")}

## Customer-facing conversion blockers found in code

| Surface | Current behavior | Required resolution |
|---|---|---|
| Imported PDP configurator | Choices without a verified delta are removed before rendering. A whole group disappears when fewer than two checkout-safe choices remain. | Preserve them in the factory catalog; publish them to checkout only after pricing is verified. |
| Option tile fallback | Can show “Unavailable online” and “Supplier price not yet verified.” | This should be a diagnostic state, not a normal live buying path. Price it or keep it out of the public checkout configurator. |
| Configurator review | Can replace checkout with “This option combination is not available to order online” and a Contact us link. | Rules may block truly incompatible combinations. Missing prices must be fixed upstream instead of becoming a support detour. |
| Doll Visualizer → cart | Returns a blocking response when a restored selected choice has no confirmed price. | Only restore checkout-safe selections; retain the preview but direct unsupported choices back to the configurator. |
| “Options on request” PDP state | The as-shown doll remains purchasable, while alternate versions require contact. | Audit whether imported supplier choices are missing. If choices exist, price and publish them rather than relying on this fallback. |

## Full unresolved product list

Each row lists only choices that still have no verified numeric price and are not explicitly free or the supplier default. The DollWOW product link is safe to review; the source link is the page used during the Rosemary pass.

| Brand | DollWOW product | Source | Source status | Unpriced groups and choices |
|---|---|---|---|---|
${blockedProducts.map(productRow).join("\n")}

## Failed source pages

${failedSources.length ? failedSources.map((product) => `- [${escapeText(product.title)}](https://dollwow.com/products/${product.handle}) — [source](${product.sourceUrl}) — ${escapeText(product.error || "source fetch failed")}`).join("\n") : "None."}

## Source pages with no usable option match

${unmatchedSources.length ? unmatchedSources.map((product) => `- [${escapeText(product.title)}](https://dollwow.com/products/${product.handle}) — [source](${product.sourceUrl}) — ${product.status}`).join("\n") : "None."}

## Definition of done for a brand

- Every known manufacturer option remains represented in the factory configuration record.
- Every public selectable option has a verified numeric delta, including zero when genuinely included.
- No valid choice disappears merely because pricing is incomplete.
- No ordinary checkout path changes its primary CTA to “ask our team” because of missing price data.
- Incompatible choices remain blocked by explicit product rules, not by absent pricing.
- A regression test covers missing-price, explicit-free, verified-included, unavailable, and incompatible states.
`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, markdown);
console.log(JSON.stringify({
  output: path.relative(ROOT, outputPath),
  checked: report.checked,
  directRosemaryUpdates: directRosemaryUpdates.length,
  unresolvedProducts: blockedProducts.length,
  unresolvedOptions: blockedProducts.reduce((sum, product) => sum + product.blockedOptions.length, 0),
  failedSources: failedSources.length,
  unmatchedSources: unmatchedSources.length
}, null, 2));

function productAudit(product) {
  const blockedGroups = [];
  const blockedOptions = [];
  for (const group of product.groups || []) {
    const options = (group.options || []).filter((option) => !hasVerifiedCheckoutPrice(option));
    if (!options.length) continue;
    blockedGroups.push({ label: group.label, options: options.map((option) => option.label) });
    blockedOptions.push(...options);
  }
  return { ...product, brand: product.brand || product.vendor || inferBrand(product), blockedGroups, blockedOptions };
}

function hasVerifiedCheckoutPrice(option) {
  if (option.priceVerified === false || option.purchasable === false) return false;
  if (Number.isFinite(option.priceDelta)) return true;
  if (/\bfree\b/i.test(option.label || "")) return true;
  if (/default supplier selection/i.test(option.productionNote || "")) return true;
  return /^(no add-on|no thanks|none|factory default|default supplier selection)$/i.test(option.label || "");
}

function summarizeByBrand(products) {
  const summary = new Map();
  for (const product of products) {
    const totals = summary.get(product.brand) || { products: 0, options: 0 };
    totals.products += 1;
    totals.options += product.blockedOptions.length;
    summary.set(product.brand, totals);
  }
  return [...summary].sort((left, right) => right[1].options - left[1].options || left[0].localeCompare(right[0]));
}

function productRow(product) {
  const choices = product.blockedGroups.map((group) => `**${escapeText(group.label)}:** ${group.options.map(escapeText).join(", ")}`).join("<br>");
  return `| ${escapeCell(product.brand)} | [${escapeText(product.title)}](https://dollwow.com/products/${product.handle}) | [Open source](${product.sourceUrl}) | ${escapeCell(product.status)} | ${choices} |`;
}

function inferBrand(product) {
  const text = `${product.title || ""} ${product.handle || ""} ${product.sourceUrl || ""}`.toLowerCase();
  const brands = [
    ["Starpery Dolls", /starpery/],
    ["Irontech Dolls", /irontech/],
    ["WM Dolls", /\bwm[- ]/],
    ["Tantaly", /tantaly/],
    ["6YE Dolls", /\b6ye\b/],
    ["Erovenus", /erovenus/],
    ["SE Doll", /\bse[- ]?doll\b|sedoll/],
    ["HR Dolls", /\bhr[- ]?dolls?\b/],
    ["Angelkiss", /angelkiss/]
  ];
  return brands.find(([, pattern]) => pattern.test(text))?.[0] || "Needs brand review";
}

function escapeText(value) { return String(value || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim(); }
function escapeCell(value) { return escapeText(value).replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function number(value) { return Number(value || 0).toLocaleString("en-US"); }
function parseArgs(values) { return Object.fromEntries(values.flatMap((value, index) => value.startsWith("--") ? [[value.slice(2), values[index + 1]?.startsWith("--") ? true : values[index + 1] ?? true]] : [])); }
