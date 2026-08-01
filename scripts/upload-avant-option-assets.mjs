import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_VERSION = "2026-04";
const SOURCE_DIR = path.join(ROOT, "tmp", "avant-official-options-clean", "2 Options");
const MAP_PATH = path.join(ROOT, "data", "avant-option-image-map.json");
const GROUPS_PATH = path.join(ROOT, "data", "avant-customization-groups.json");
let tokenCache = null;

await loadLocalEnv();
assertShopifyAdminEnv();

const dryRun = !process.argv.includes("--execute");
const files = await collectFiles(SOURCE_DIR);
if (!files.length) throw new Error(`No official Avant files found in ${SOURCE_DIR}`);

const source = indexSourceFiles(files);
const requested = buildRequestedAssets(source);
console.log(`Prepared ${requested.length} official Avant option images.`);

if (dryRun) {
  console.log("Dry run only. Add --execute to upload official option images and update the configuration file.");
  for (const asset of requested) console.log(`${asset.key}: ${path.relative(SOURCE_DIR, asset.path)}`);
  process.exit(0);
}

const existingMap = await readJson(MAP_PATH, {});
const uploaded = { ...existingMap };
const pending = requested.filter((asset) => !uploaded[asset.key]);

for (let start = 0; start < pending.length; start += 8) {
  const batch = pending.slice(start, start + 8);
  const results = await Promise.all(batch.map(async (asset) => [asset.key, await uploadImage(asset)]));
  for (const [key, url] of results) uploaded[key] = url;
  await fs.writeFile(MAP_PATH, `${JSON.stringify(uploaded, null, 2)}\n`);
  console.log(`Uploaded ${Math.min(start + batch.length, pending.length)}/${pending.length} official images.`);
}

await fs.writeFile(MAP_PATH, `${JSON.stringify(uploaded, null, 2)}\n`);

const config = await readJson(GROUPS_PATH);
applySwatches(config.groups, uploaded);
await fs.writeFile(GROUPS_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Updated ${path.relative(ROOT, GROUPS_PATH)} and ${path.relative(ROOT, MAP_PATH)}.`);

function buildRequestedAssets(source) {
  const assets = [];
  const add = (key, relativePath) => assets.push({ key, path: source.get(relativePath) ?? missing(relativePath) });
  const addPrefix = (key, startsWith, occurrence = 0) => {
    const matched = [...source.entries()].filter(([entry]) => entry.toLowerCase().startsWith(startsWith.toLowerCase()))[occurrence];
    assets.push({ key, path: matched?.[1] ?? missing(startsWith) });
  };

  add("head:ros-wig", "ROS Head/Sue.jpg");
  add("head:ros-implanted-hair", "Implanted Hair/01 Implanted Hair.jpg");
  add("skin:wheat", "Skin color/Wheat.jpg");
  add("skin:white", "Skin color/White.jpg");
  add("wig:factory-wig", "Wig/1.png");
  add("wig:simple-wig-change", "Wig/2.png");
  add("wig:complex-custom-wig", "Wig/A-1.png");

  for (let number = 1; number <= 20; number += 1) add(`eye:${String(number).padStart(2, "0")}`, `Eye Color/${number}.png`);
  addPrefix("eye-style:standard", "Eye Color/Glass Resin Eyes", 0);
  addPrefix("eye-style:veined", "Eye Color/Glass Resin Eyes", 1);

  for (let number = 1; number <= 4; number += 1) add(`lip:${String(number).padStart(2, "0")}`, `lip color/NO.${number}.jpg`);
  for (const label of ["Bright pink", "Light pink", "Natural", "Brown", "Dark brown", "Bright red"]) add(`areola:${slug(label)}`, `Areola color/${label}.png`);
  add("breast:gel", "Breast Type/01 Gel-breasts.jpg");
  add("breast:solid", "Breast Type/02 Solid-breasts.jpg");

  const finger = {
    white: "No.1.White.png", black: "No.2.Black.png", pink: "No.3.Pink.png", red: "No.4.Red.png", purple: "No.5.Purple.png", natural: "No.6.Natural.png", green: "No.7.Green.png", "matte-red": "No.M1.Matte Red.png", "matte-black": "No.M2.Matte Black.png", "long-natural": "No.L1.Long - Natural.png", "long-red": "No.L2.Long - Red.png", "long-black": "No.L3.Long- Black.png"
  };
  for (const [key, filename] of Object.entries(finger)) add(`finger:${key}`, `Finger nail color/${filename}`);

  const toe = {
    white: "No.1", black: "No.2", pink: "No.3", red: "No.4", purple: "No.5", natural: "No.6", green: "No.7", "matte-red": "No.M1", "matte-black": "No.M2"
  };
  for (const [key, prefix] of Object.entries(toe)) addPrefix(`toe:${key}`, `Toe nail color/${prefix}`);

  add("foot:hard-feet", "Foot type/FootHard .jpg");
  add("foot:standing-bolts", "Foot type/FootBolts .jpg");
  add("foot:non-standing", "Foot type/FootStandard .jpg");
  add("toes:wire-toes", "Feet Skeleton/WiredToe.jpg");
  add("toes:toe-bones", "Feet Skeleton/Jointed toes.jpg");
  add("functional:heating", "Heating Blanket/1.jpg");
  add("care:head-stand", "Accessories/PVC Doll Head Stand/PVC Doll Head Stand (1).jpg");
  add("care:heating-blanket", "Heating Blanket/1.jpg");

  return assets;
}

function applySwatches(groups, urls) {
  const byGroup = new Map(groups.map((group) => [group.id, group]));
  const apply = (groupId, keyPrefix, optionId = (id) => id) => {
    const group = byGroup.get(groupId);
    if (!group) return;
    for (const option of group.options ?? []) {
      const url = urls[`${keyPrefix}:${optionId(option.id)}`];
      if (url) option.swatch = { kind: "image", value: url };
    }
  };

  apply("head-hair-finish", "head");
  apply("skin-tone", "skin");
  apply("wig-style", "wig");
  apply("eye-color", "eye", (id) => id.replace("eye-", ""));
  apply("lip-color", "lip", (id) => id.replace("lip-", ""));
  apply("areola-color", "areola");
  apply("breast-fill", "breast");
  apply("finger-nail-color", "finger");
  apply("toe-nail-color", "toe");
  apply("foot-type", "foot");
  apply("toe-construction", "toes");
  apply("functional-upgrades", "functional");
  apply("care-and-storage", "care");

  const eyeStyle = byGroup.get("eye-style");
  if (eyeStyle) {
    const standard = urls["eye-style:standard"];
    const veined = urls["eye-style:veined"];
    for (const option of eyeStyle.options ?? []) {
      const url = option.id === "standard" ? standard : veined;
      if (url) option.swatch = { kind: "image", value: url };
    }
  }
}

async function uploadImage(asset) {
  const buffer = await fs.readFile(asset.path);
  const filename = `avant-${asset.key.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 10)}${path.extname(asset.path).toLowerCase()}`;
  const mimeType = mimeFor(asset.path);
  const staged = await adminFetch(
    `mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    { input: [{ resource: "IMAGE", filename, mimeType, httpMethod: "POST", fileSize: String(buffer.length) }] }
  );
  const error = staged.stagedUploadsCreate.userErrors?.[0];
  if (error) throw new Error(`Could not stage ${asset.key}: ${error.message}`);
  const target = staged.stagedUploadsCreate.stagedTargets?.[0];
  if (!target) throw new Error(`No staged target returned for ${asset.key}`);

  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append("file", new Blob([buffer], { type: mimeType }), filename);
  const response = await fetch(target.url, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Could not upload ${asset.key}: HTTP ${response.status}`);

  const created = await adminFetch(
    `mutation FileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { __typename ... on MediaImage { id fileStatus image { url } } }
        userErrors { field message }
      }
    }`,
    { files: [{ alt: `Avant Doll ${asset.key.replace(/[-:]/g, " ")} reference`, contentType: "IMAGE", originalSource: target.resourceUrl, filename }] }
  );
  const createError = created.fileCreate.userErrors?.[0];
  if (createError) throw new Error(`Could not create ${asset.key}: ${createError.message}`);
  const file = created.fileCreate.files?.[0];
  return waitForFile(file?.id, asset.key);
}

async function waitForFile(id, assetKey) {
  if (!id) throw new Error(`No file id returned for ${assetKey}`);
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const data = await adminFetch(`query File($id: ID!) { node(id: $id) { ... on MediaImage { fileStatus image { url } } } }`, { id });
    const file = data.node;
    if (file?.fileStatus === "READY" && file.image?.url) return file.image.url;
    if (file?.fileStatus === "FAILED") throw new Error(`Shopify processing failed for ${assetKey}`);
    await delay(1200);
  }
  throw new Error(`Timed out processing ${assetKey}`);
}

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(fullPath) : [fullPath];
  }));
  return nested.flat();
}

function indexSourceFiles(files) {
  return new Map(files.map((file) => [path.relative(SOURCE_DIR, file).replaceAll(path.sep, "/"), file]));
}

function missing(relativePath) {
  throw new Error(`Official option asset missing: ${relativePath}`);
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
}

async function adminFetch(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.[0]?.message || `Shopify HTTP ${response.status}`);
  return payload.data;
}

async function getAdminAccessToken(domain) {
  if (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET
    })
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || "Could not obtain Shopify Admin token.");
  tokenCache = { accessToken: payload.access_token, expiresAt: Date.now() + Math.max((payload.expires_in || 3600) - 60, 60) * 1000 };
  return tokenCache.accessToken;
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

async function loadLocalEnv() {
  const content = await fs.readFile(path.join(ROOT, ".env.local"), "utf8").catch(() => "");
  for (const line of content.split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index < 1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, index).trim();
    process.env[key] ||= line.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, "");
  }
}

function assertShopifyAdminEnv() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) {
    throw new Error("SHOPIFY_STORE_DOMAIN plus SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET are required.");
  }
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
