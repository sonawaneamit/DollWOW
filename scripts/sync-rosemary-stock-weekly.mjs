import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const date = new Date().toISOString().slice(0, 10);
const regions = {
  usa: "https://www.rosemarydoll.com/in-stock-sex-dolls/sex-dolls-usa/",
  eu: "https://www.rosemarydoll.com/in-stock-sex-dolls/eu-sex-dolls/",
  canada: "https://www.rosemarydoll.com/in-stock-sex-dolls/sex-dolls-canada/",
  australia: "https://www.rosemarydoll.com/in-stock-sex-dolls/sex-dolls-australia/"
};

for (const [region, url] of Object.entries(regions)) {
  const input = `data/imports/rosemary-stock-${region}-${date}.json`;
  run("node", ["scripts/scrape-rosemary.mjs", "--url", url, "--limit", "400", "--local", "--out", input]);
  run("node", ["scripts/prepare-rosemary-import.mjs", "--input", input]);
}

// Current products are updated automatically. New products remain in a review
// artifact so a newly scraped item is never silently published.
run("node", [
  "scripts/reconcile-rosemary-stock.mjs",
  "--date", date,
  "--execute-drafts",
  "--execute-regions",
  "--execute-options",
  "--prepare-missing"
]);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, env: process.env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
