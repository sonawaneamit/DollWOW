import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Map(process.argv.slice(2).map((value, index, list) => [value, list[index + 1]]));
const source = args.get("--source");
const runId = args.get("--run-id");

const sourceConfig = {
  official: {
    collectionUrl: "https://www.rosretty.com/collections/all",
    output: "data/imports/rosretty-official.json"
  },
  yourdoll: {
    collectionUrl: "https://www.yourdoll.com/rosretty-doll/",
    output: "data/imports/rosretty-yourdoll.json"
  }
}[source];

if (!sourceConfig) throw new Error("Use --source official or --source yourdoll.");
if (!runId) throw new Error("Use --run-id <Apify run id>.");

await loadLocalEnv();
if (!process.env.APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN is required to finalize a Rosretty review capture.");

const headers = { Authorization: `Bearer ${process.env.APIFY_API_TOKEN}` };
const runResponse = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}`, { headers });
if (!runResponse.ok) throw new Error(`Could not read Apify run ${runId} (${runResponse.status}).`);
const run = (await runResponse.json()).data;
if (run.status !== "SUCCEEDED") throw new Error(`Apify run ${runId} is ${run.status}; wait for it to finish before finalizing.`);
if (!run.defaultDatasetId) throw new Error(`Apify run ${runId} has no result dataset.`);

const datasetResponse = await fetch(
  `https://api.apify.com/v2/datasets/${encodeURIComponent(run.defaultDatasetId)}/items?clean=true&limit=1000`,
  { headers }
);
if (!datasetResponse.ok) throw new Error(`Could not read Apify dataset ${run.defaultDatasetId} (${datasetResponse.status}).`);
const rawItems = await datasetResponse.json();
const products = uniqueByUrl(
  rawItems
    .filter((item) => item?.sourceUrl && item?.title)
    .map((item) => ({ ...item, source }))
);

const outputPath = path.resolve(args.get("--output") || path.join(ROOT, sourceConfig.output));
const existingProducts = args.has("--append") ? await readExistingProducts(outputPath) : [];
const mergedProducts = uniqueByUrl([...existingProducts, ...products]);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(
  outputPath,
  `${JSON.stringify({
    source,
    collectionUrl: sourceConfig.collectionUrl,
    capturedAt: new Date().toISOString(),
    apifyRunId: runId,
    apifyDatasetId: run.defaultDatasetId,
    products: mergedProducts
  }, null, 2)}\n`
);

console.log(JSON.stringify({
  source,
  runId,
  datasetId: run.defaultDatasetId,
  captured: products.length,
  productCount: mergedProducts.length,
  outputPath
}, null, 2));

async function loadLocalEnv() {
  try {
    const contents = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Deployment environment can supply credentials instead.
  }
}

async function readExistingProducts(filePath) {
  try {
    const captured = JSON.parse(await fs.readFile(filePath, "utf8"));
    return Array.isArray(captured.products) ? captured.products : [];
  } catch {
    return [];
  }
}

function uniqueByUrl(products) {
  return [...new Map(products.map((product) => [product.sourceUrl, product])).values()];
}
