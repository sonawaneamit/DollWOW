import fs from "node:fs/promises";
import path from "node:path";

const SITE_ORIGIN = "https://dollwow.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const DEFAULT_KEY = "d4d5fc24-2236-4ad3-be46-f806a537ff83";
const MAX_URLS_PER_REQUEST = 10_000;

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

const key = String(process.env.INDEXNOW_KEY || DEFAULT_KEY).trim();
const keyLocation = `${SITE_ORIGIN}/${key}.txt`;
const urls = await collectUrls(args);

if (!urls.length) {
  throw new Error("Provide at least one changed URL with --url, --urls, or --file.");
}

for (const url of urls) {
  const parsed = new URL(url);
  if (parsed.origin !== SITE_ORIGIN) {
    throw new Error(`IndexNow URL must belong to ${SITE_ORIGIN}: ${url}`);
  }
}

const payload = {
  host: new URL(SITE_ORIGIN).host,
  key,
  keyLocation,
  urlList: urls
};

if (!args.execute) {
  console.log(`Dry run: ${urls.length} changed URL${urls.length === 1 ? "" : "s"} ready for IndexNow.`);
  console.log(JSON.stringify(payload, null, 2));
  console.log("Add --execute after the key file is live on dollwow.com.");
  process.exit(0);
}

const keyResponse = await fetch(keyLocation);
if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
  throw new Error(`IndexNow key file is not live or does not match: ${keyLocation}`);
}

for (let index = 0; index < urls.length; index += MAX_URLS_PER_REQUEST) {
  const urlList = urls.slice(index, index + MAX_URLS_PER_REQUEST);
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ...payload, urlList })
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new Error(`IndexNow returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  console.log(`Submitted ${urlList.length} changed URL${urlList.length === 1 ? "" : "s"} to IndexNow (HTTP ${response.status}).`);
}

async function collectUrls(parsedArgs) {
  const values = [];
  values.push(...parsedArgs.url);
  if (parsedArgs.urls) values.push(...parsedArgs.urls.split(/[\n,]/));
  if (parsedArgs.file) {
    const file = await fs.readFile(path.resolve(parsedArgs.file), "utf8");
    values.push(...file.split(/[\n,]/));
  }

  return [...new Set(values.map(normalizeUrl).filter(Boolean))];
}

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (!text || text.startsWith("#")) return "";
  const url = new URL(text, SITE_ORIGIN);
  url.hash = "";
  return url.toString().replace(/\/$/, url.pathname === "/" ? "/" : "");
}

function parseArgs(values) {
  const parsed = { execute: false, help: false, url: [], urls: "", file: "" };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--execute") parsed.execute = true;
    else if (value === "--help" || value === "-h") parsed.help = true;
    else if (value === "--url") parsed.url.push(values[++index] || "");
    else if (value === "--urls") parsed.urls = values[++index] || "";
    else if (value === "--file") parsed.file = values[++index] || "";
    else throw new Error(`Unknown argument: ${value}`);
  }
  return parsed;
}

function printHelp() {
  console.log(`Submit recently changed DollWow URLs through IndexNow.

Usage:
  npm run seo:indexnow -- --url /learn/sex-doll-guide
  npm run seo:indexnow -- --urls '/learn/sex-doll-guide,/shop/sex-dolls'
  npm run seo:indexnow -- --file changed-urls.txt

Options:
  --url <url>     Add one absolute URL or DollWow path. Repeatable.
  --urls <list>   Add comma-separated or newline-separated URLs.
  --file <path>   Read changed URLs from a text file.
  --execute       Verify the live key and submit. Omit for a dry run.
`);
}
