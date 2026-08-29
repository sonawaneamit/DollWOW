#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ENV_SOURCE = process.env.DOLLWOW_ENV_FILE || path.join(ROOT, ".env.local");
const WORK = path.join(ROOT, "tmp/lusandy-nadia-159");
const GALLERY = path.join(WORK, "gallery");
const VIDEO_PATH = path.join(WORK, "Lusandy-159-Nadia-video.mov");
const PLAN_PATH = path.join(WORK, "publish-plan.json");
const EDITORIAL_PATH = path.join(ROOT, "data/exports/pdp-phase/lusandy-nadia-159-editorial.json");
const RESULT_PATH = "/Users/amitsonawane/codex-proof/lusandy-nadia-159-result.md";
const API_VERSION = "2026-04";
const BELLE_HANDLE = "lusandy-belle-159cm-h-cup-silicone-companion-doll";
const HANDLE = "lusandy-nadia-159cm-g-cup-silicone-companion-doll";
const TITLE = "Lusandy Nadia 159cm G-Cup Silicone Customizable Companion Doll";
const SEO_TITLE = `${TITLE} | DollWow`;
const SEO_DESCRIPTION = "Explore Lusandy Nadia, a 159cm G-cup silicone customizable companion doll with a Super Light body, detailed measurements, and factory-order support.";
const SOURCE_URL = "https://lusandydoll.com/products/lusandy-nadia-thicc-silicone-doll-159cm";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1TkT9DFBC7O-iZDBSnuV-Uq9aPIoJmAcW";
const VIDEO_DRIVE_ID = "19ywdt29DXbs10pLm0MCSeT2Wwn8B6w3D";
const SKU = "LUSANDY-159-G-NADIA-CUSTOM";
const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const downloadVideo = execute || args.has("--download-video");

const DRIVE_IMAGES = [
  ["LUS_2716.jpg", "18kD_2-dZLK0_cHkwLGHweBzLmf_diNJf"],
  ["LUS_2724.jpg", "10PP5Z1-QE5Nji0dqsuqr2ictXjqwDCTM"],
  ["LUS_2737.jpg", "1c1gKDat6bvCVBv22gb01H4Lhx89sS4sm"],
  ["LUS_2747.jpg", "1UFTOF5ttJBbXvATs6YqVMYSF0yNH7f2H"],
  ["LUS_2766.jpg", "1DdtuGW1Wbdex4Yc3x21sggtzzXqKZ-Kv"],
  ["LUS_2776.jpg", "1_QiUAlk02iSzJiBS8fwX_S6QMk2nyncU"],
  ["LUS_2801.jpg", "1tmv5xtQdKuMcn1luQWcQb35UQCMEZh6_"],
  ["LUS_2846.jpg", "1bhbQi3VKSUd_yNm8WQUrmxYirj7B21px"],
  ["LUS_2859.jpg", "1R1qDiU5enqzr1M9pctvI6MH76h3eHjRZ"],
  ["LUS_2887.jpg", "1bOs2SuL4nx8rmwXx9BFF9iKOEgCfMw46"],
  ["LUS_2898.jpg", "1GORjOIEYZLaMKa6prN3GL72moxyxYaB3"],
  ["LUS_2948.jpg", "1FGuBHGctzdQvGMR8LB38lMPRKGyCXRTE"],
  ["LUS_2981.jpg", "1gqpmPfDO28esz7h1cCcEPSn5-bV9cQ5L"],
  ["LUS_3016.jpg", "1XWCmR7HjNltg06r2_yO26z5bAYYTysrU"],
  ["LUS_3040.jpg", "1OAkesU5xi88-r5gI7kQojHRhE31iWlgk"],
  ["LUS_3055.jpg", "14Ar45FJoZS5uhxQYGBA3UDFJyZb0vS4v"],
  ["LUS_3084.jpg", "1VyR9zmxmnoq_RHtlz7-NPRyPjRu7j5H2"],
  ["LUS_3119.jpg", "1RVLRPKOQCSG60Z2HclbFbWBBpltYJBIk"],
  ["LUS_3141.jpg", "1x3_9f6koFJ7Zpm10j8KX7ghy4ti7ZlgR"],
  ["LUS_3163.jpg", "1QBt8gMM5JlrE-m6vUnnsANTPdImXr425"],
  ["LUS_3173.jpg", "1310rohsjGHmMWPIXhwpmFh_TNqBl00YA"],
  ["LUS_3209.jpg", "154s09-DBIjxxcmL2R-PLxs4Ap1b3MAE9"],
  ["LUS_3245.jpg", "1ekVOQwu1idH77w1VomE6Xirjn9iexumK"],
  ["LUS_3271.jpg", "1lt1FL2zDCGp515QP5PGwE26_byeJxTJ4"],
  ["LUS_3279.jpg", "1OpD2YyPrWSiHFVLQ2sYVxQoGhBiCZbh3"],
  ["LUS_3286.jpg", "179z4U3nIq4MqhoNPu0p3pcYxGBDJCxvr"],
  ["LUS_3296.jpg", "1B5GeMXmqvY_h3oOa3NZ7hiwHPWUg2lQx"],
  ["LUS_3299.jpg", "1bkVsc3GgJlqFLHonE3pUur5OI2XJJkZA"],
  ["LUS_3317.jpg", "1m7U1Rs93ygSSIiQAhKU7Zdglzo1Fhxp4"]
];

let tokenCache;
let productId = "";

await loadEnv();
await fs.mkdir(GALLERY, { recursive: true });

try {
  assertCredentials();
  const belle = await findByHandle(BELLE_HANDLE);
  if (!belle || belle.handle !== BELLE_HANDLE || belle.status !== "ACTIVE") {
    throw new Error("Live Belle 159 custom reference was not found in ACTIVE state.");
  }
  const reference = await inspectProduct(belle.id);
  const groups = enableNadiaDollVue(parseGroups(reference.customizationGroups?.value));
  assertGroups(groups);

  const existing = await findByHandle(HANDLE);
  if (existing && existing.handle !== HANDLE) throw new Error(`Handle search returned unexpected product ${existing.handle}.`);
  productId = existing?.id || "";

  const imageFiles = await downloadGallery();
  if (downloadVideo) await downloadDriveFile(VIDEO_DRIVE_ID, VIDEO_PATH, "video/quicktime", 10_000_000);
  const input = buildProductInput(groups);
  const plan = {
    generatedAt: new Date().toISOString(),
    execute,
    existingProductId: productId || null,
    protectedReference: { id: reference.id, handle: reference.handle },
    product: input,
    variant: { price: "2811.00", compareAtPrice: "3999.00", sku: SKU, inventoryPolicy: "CONTINUE", tracked: false },
    media: { gallerySource: DRIVE_FOLDER_URL, imageFiles: imageFiles.map((file) => path.basename(file)), imageCount: imageFiles.length, videoDriveId: VIDEO_DRIVE_ID, videoDownloaded: downloadVideo },
    publicationTargets: ["Online Store", "DollWOW Headless"],
    discountMutation: false
  };
  await fs.writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);

  if (!execute) {
    console.log(`DRY RUN\nPlan: ${PLAN_PATH}\nExisting target: ${productId || "none"}\nImages: ${imageFiles.length}\nVideo downloaded: ${downloadVideo ? "yes" : "no"}\nGroups: ${groups.length}\nRun with --execute after asset review.`);
    process.exit(0);
  }

  let product;
  if (existing) {
    product = await updateProduct(existing.id, input);
  } else {
    const stagedImages = await stageFiles(imageFiles, "IMAGE", "image/jpeg");
    product = await createProduct(input, stagedImages, imageFiles);
  }
  productId = product.id;
  const variantId = product.variants.nodes[0]?.id;
  if (!variantId) throw new Error("Shopify did not return a product variant.");
  await updateVariant(product.id, variantId);

  const current = await inspectProduct(product.id);
  if (!current.media.nodes.some((item) => item.mediaContentType === "VIDEO")) {
    const [stagedVideo] = await stageFiles([VIDEO_PATH], "VIDEO", "video/quicktime");
    await attachVideo(product.id, stagedVideo);
  }
  await waitForMedia(product.id);
  const beforePublish = await inspectProduct(product.id);
  assertProduct(beforePublish, groups, { published: false });

  const publications = await targetPublications();
  await activateAndPublish(product.id, publications);
  const verified = await waitForPublishedProduct(product.id, groups);
  const editorial = await applyEditorial(product.id);
  const live = await verifyStorefront(verified.handle, editorial);
  const cart = await verifyDefaultCart(verified.variants.nodes[0].id);
  const belleAfter = await inspectProduct(reference.id);
  assertReferenceUnchanged(reference, belleAfter);

  const liveUrl = `https://dollwow.com/products/${HANDLE}`;
  const hardRefreshUrl = `${liveUrl}?v=${Math.floor(Date.now() / 1000)}`;
  const result = [
    "OK",
    `Live URL: ${liveUrl}`,
    `Admin product id: ${verified.id}`,
    `Handle: ${verified.handle}`,
    `Status: ${verified.status}; published to ${publishedNames(verified).join(" and ")}`,
    `Price: ${verified.variants.nodes[0].price}`,
    `Compare-at: ${verified.variants.nodes[0].compareAtPrice}`,
    `Option-group count: ${groups.length} (${groups.flatMap((group) => group.options).length} choices)`,
    `Customizer: ${live.customizer ? "on" : "missing"}`,
    `DollVue: ${live.dollVue ? "on" : "pending app deployment"}`,
    `Ready to ship: false (stock_status=custom; no RTS tags or badge fields)`,
    `Gallery source: Drive (${verified.media.nodes.filter((item) => item.mediaContentType === "IMAGE").length} factory stills)`,
    `Video: Drive approved non-nude file (${verified.media.nodes.filter((item) => item.mediaContentType === "VIDEO").length} attached); nude file not used`,
    `Magazine block: ${editorial.promptVersion} (${live.editorial ? "live" : "missing"})`,
    `Default-options checkout base: ${cart.baseAmount} ${cart.currencyCode}; cart total ${cart.totalAmount} ${cart.currencyCode}`,
    "10% summer discount: LEFT UNCHANGED (sitewide still applies)",
    `HTTP status: ${live.status}`,
    "Belle custom reference unchanged: yes",
    "Blocker: none",
    "Tokens used: reported in the final Codex response",
    `Hard-refresh URL: ${hardRefreshUrl}`
  ].join("\n") + "\n";
  await fs.writeFile(RESULT_PATH, result);
  console.log(result);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const url = `https://dollwow.com/products/${HANDLE}`;
  const failure = [`BLOCKER: ${message}`, `Live URL: ${url}`, `Admin product id: ${productId || "not available"}`, "10% summer discount: LEFT UNCHANGED", `Hard-refresh URL: ${url}?v=${Math.floor(Date.now() / 1000)}`].join("\n") + "\n";
  await fs.writeFile(RESULT_PATH, failure);
  console.error(failure);
  process.exitCode = 1;
}

function buildProductInput(groups) {
  const measurements = {
    Height: "5 ft 3 in / 159 cm",
    Weight: "77.2 lbs / 35 kg (Super Weight Reduction)",
    "Cup size": "G-Cup",
    Bust: "3 ft 2 in / 96 cm",
    Underbust: "2 ft 4 in / 70 cm",
    Waist: "2 ft 1 in / 63 cm",
    Hip: "3 ft 7 in / 109 cm",
    "Feet Length": "7.9 in / 20 cm",
    "Vagina Depth": "7.1 in / 18 cm",
    "Anus Depth": "5.5 in / 14 cm",
    "Oral Depth": "5.1 in / 13 cm",
    Body: "Super Light",
    "Factory skin tone": "Tan"
  };
  const rows = Object.entries(measurements).map(([key, value]) => `<li>\n<strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`).join("\n");
  const descriptionHtml = `<p>${TITLE} is a 159 cm silicone custom factory-order model with a G-cup, 96 / 63 / 109 cm measurements, and a 35 kg Super Weight Reduction body. Review the verified model details and available configuration choices below.</p><ul>\n${rows}\n<li>\n<strong>Brand:</strong> Lusandy</li>\n<li>\n<strong>Material:</strong> Silicone</li>\n<li>\n<strong>Availability:</strong> Custom factory order</li>\n<li>\n<strong>Delivery:</strong> Est. 3 weeks</li>\n</ul><p>For custom orders, factory photos are shared for your approval before shipment.</p>`;
  return {
    title: TITLE,
    handle: HANDLE,
    descriptionHtml,
    vendor: "DollWow",
    productType: "Custom Silicone doll",
    tags: ["custom", "customizable", "female-doll", "full-doll", "gender-female", "height-155-159", "lusandy", "silicone"],
    status: "DRAFT",
    seo: { title: SEO_TITLE, description: SEO_DESCRIPTION },
    metafields: [
      metafield("custom", "catalog_identity_key", "lusandy__nadia__159cm__g-cup__silicone__head-nadia"),
      metafield("custom", "catalog_body_identity_key", "lusandy__nadia__159cm__g-cup__silicone"),
      metafield("custom", "display_name", "Nadia"),
      metafield("custom", "head_model", "Nadia"),
      metafield("custom", "body_type", "female"),
      metafield("custom", "brand", "Lusandy"),
      metafield("custom", "material", "Silicone"),
      metafield("custom", "height_cm", "159", "number_integer"),
      metafield("custom", "weight_lb", "77.2", "number_decimal"),
      metafield("custom", "cup_size", "G-Cup"),
      metafield("custom", "measurements", JSON.stringify(measurements), "json"),
      metafield("custom", "stock_status", "custom"),
      metafield("custom", "delivery_estimate", "Est. 3 weeks"),
      metafield("custom", "custom_available", "true", "boolean"),
      metafield("custom", "customization_groups", JSON.stringify(groups), "json"),
      metafield("custom", "qc_note", "Final details are confirmed before checkout or production.", "multi_line_text_field"),
      metafield("custom", "source_url", SOURCE_URL),
      metafield("custom", "source_title", "Lusandy Nadia 159cm G-Cup Silicone Doll"),
      metafield("custom", "source_handle", "lusandy-nadia-silicone-doll-159cm"),
      metafield("global", "title_tag", SEO_TITLE),
      metafield("global", "description_tag", SEO_DESCRIPTION)
    ]
  };
}

function enableNadiaDollVue(groups) {
  const enabledGroups = new Set([
    "select-skin-tone", "select-hairstyle", "select-hair-color", "select-eye-color", "select-nail-color",
    "select-toenail-color", "select-areola-color", "select-labia-color", "select-vagina-hair-type",
    "select-premium-head-body-options-multiple"
  ]);
  return groups.map((group) => ({
    ...group,
    options: group.options.map((option) => ({
      ...option,
      ...(enabledGroups.has(group.id) && option.swatch?.kind === "image" && !/^(no change|standard)$/i.test(option.label)
        ? { dollVueEnabled: true }
        : {})
    }))
  }));
}

function assertGroups(groups) {
  if (groups.length !== 33) throw new Error(`Belle custom reference has ${groups.length} groups; expected 33.`);
  const options = groups.flatMap((group) => group.options || []);
  if (options.length !== 185) throw new Error(`Belle custom reference has ${options.length} choices; expected 185.`);
  if (options.filter((option) => option.swatch?.kind === "image").length !== 182) throw new Error("Belle option-thumb count changed from the approved 182-image pattern.");
  if (/real[-\s_]?skin texture|full body skin texture/i.test(JSON.stringify(groups))) throw new Error("Real Skin Texture appeared in the customization source.");
  if (!options.some((option) => option.dollVueEnabled === true)) throw new Error("No Nadia options were marked DollVue-capable.");
}

function assertProduct(product, groups, { published }) {
  const variant = product.variants.nodes[0];
  const liveGroups = parseGroups(product.customizationGroups?.value);
  const forbidden = `${product.title} ${product.descriptionHtml} ${(product.tags || []).join(" ")}`;
  const failures = [];
  if (product.handle !== HANDLE) failures.push(`handle=${product.handle}`);
  if (product.title !== TITLE) failures.push(`title=${product.title}`);
  if (product.vendor !== "DollWow") failures.push(`vendor=${product.vendor}`);
  if (product.productType !== "Custom Silicone doll") failures.push(`productType=${product.productType}`);
  if (variant?.price !== "2811.00" || variant?.compareAtPrice !== "3999.00") failures.push(`price=${variant?.price}/${variant?.compareAtPrice}`);
  if (variant?.sku !== SKU || variant?.inventoryPolicy !== "CONTINUE" || variant?.inventoryItem?.tracked !== false) failures.push("variant custom-order configuration mismatch");
  if (liveGroups.length !== groups.length) failures.push(`groups=${liveGroups.length}`);
  if (product.stockStatus?.value !== "custom" || product.customAvailable?.value !== "true") failures.push("custom flags mismatch");
  if (product.cupSize?.value !== "G-Cup") failures.push(`cup=${product.cupSize?.value}`);
  if (product.warehouseCountry?.value) failures.push(`warehouse_country=${product.warehouseCountry.value}`);
  if (/\b(thicc|madia|bbw|chloe|ready[_ -]?to[_ -]?ship|real skin texture)\b/i.test(forbidden)) failures.push("forbidden source/RTS phrase present");
  if ((product.tags || []).some((tag) => /ready[_ -]?to[_ -]?ship|\brts\b/i.test(tag))) failures.push("RTS tag present");
  if (published && (!publishedNames(product).includes("Online Store") || !publishedNames(product).some((name) => /headless/i.test(name)))) failures.push("required publication missing");
  if (failures.length) throw new Error(`Admin verification failed: ${failures.join("; ")}`);
}

async function downloadGallery() {
  const files = [];
  for (const [name, id] of DRIVE_IMAGES) {
    const target = path.join(GALLERY, name);
    await downloadDriveFile(id, target, "image/jpeg", 100_000);
    files.push(target);
  }
  if (files.length !== 29) throw new Error(`Drive gallery has ${files.length} files; expected 29.`);
  return files;
}

async function downloadDriveFile(id, target, expectedType, minimumBytes) {
  try {
    const stat = await fs.stat(target);
    if (stat.size >= minimumBytes) return target;
  } catch {}
  const response = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, { redirect: "follow" });
  const type = response.headers.get("content-type") || "";
  const bytes = Buffer.from(await response.arrayBuffer());
  const typeMatches = type.toLowerCase().startsWith(expectedType) || (expectedType.startsWith("video/") && type.toLowerCase().startsWith("application/octet-stream"));
  if (!response.ok || !typeMatches || bytes.length < minimumBytes) {
    throw new Error(`Drive download failed for ${path.basename(target)}: HTTP ${response.status}, ${type}, ${bytes.length} bytes.`);
  }
  if (expectedType === "image/jpeg" && (bytes[0] !== 0xff || bytes[1] !== 0xd8)) throw new Error(`${path.basename(target)} is not a JPEG.`);
  await fs.writeFile(target, bytes);
  return target;
}

async function createProduct(input, stagedImages, files) {
  const data = await admin(`mutation Create($product: ProductCreateInput!, $media: [CreateMediaInput!]) { productCreate(product: $product, media: $media) { product { id handle status variants(first: 1) { nodes { id } } } userErrors { field message } } }`, {
    product: input,
    media: stagedImages.map((source, index) => ({ originalSource: source, mediaContentType: "IMAGE", alt: `${TITLE} — authorized factory still ${path.basename(files[index], path.extname(files[index]))}` }))
  });
  mutationErrors("productCreate", data.productCreate.userErrors);
  if (!data.productCreate.product) throw new Error("productCreate returned no product.");
  return data.productCreate.product;
}

async function updateProduct(id, input) {
  const data = await admin(`mutation Update($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id handle status variants(first: 1) { nodes { id } } } userErrors { field message } } }`, { product: { ...input, id } });
  mutationErrors("productUpdate", data.productUpdate.userErrors);
  return data.productUpdate.product;
}

async function updateVariant(productId, variantId) {
  const data = await admin(`mutation Variant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } } }`, {
    productId,
    variants: [{ id: variantId, price: "2811.00", compareAtPrice: "3999.00", inventoryPolicy: "CONTINUE", taxable: true, inventoryItem: { sku: SKU, tracked: false } }]
  });
  mutationErrors("productVariantsBulkUpdate", data.productVariantsBulkUpdate.userErrors);
}

async function stageFiles(files, resource, mimeType) {
  const stagingInput = await Promise.all(files.map(async (file) => {
    const input = { resource, filename: path.basename(file), mimeType, httpMethod: "POST" };
    if (resource === "VIDEO") input.fileSize = String((await fs.stat(file)).size);
    return input;
  }));
  const data = await admin(`mutation Stage($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`, {
    input: stagingInput
  });
  mutationErrors("stagedUploadsCreate", data.stagedUploadsCreate.userErrors);
  const targets = data.stagedUploadsCreate.stagedTargets;
  if (targets.length !== files.length) throw new Error(`Staging returned ${targets.length}/${files.length} targets.`);
  await mapLimit(targets, resource === "VIDEO" ? 1 : 4, async (target, index) => {
    const form = new FormData();
    for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
    form.append("file", new Blob([await fs.readFile(files[index])], { type: mimeType }), path.basename(files[index]));
    const response = await fetch(target.url, { method: "POST", body: form });
    if (!response.ok) throw new Error(`Staged upload failed for ${path.basename(files[index])}: HTTP ${response.status}`);
  });
  return targets.map((target) => target.resourceUrl);
}

async function attachVideo(productId, source) {
  const data = await admin(`mutation AddVideo($productId: ID!, $media: [CreateMediaInput!]!) { productCreateMedia(productId: $productId, media: $media) { mediaUserErrors { field message } } }`, {
    productId,
    media: [{ originalSource: source, mediaContentType: "VIDEO", alt: `${TITLE} — authorized factory video` }]
  });
  mutationErrors("productCreateMedia", data.productCreateMedia.mediaUserErrors);
}

async function activateAndPublish(id, publications) {
  const update = await admin(`mutation Activate($product: ProductUpdateInput!) { productUpdate(product: $product) { userErrors { field message } } }`, { product: { id, status: "ACTIVE" } });
  mutationErrors("productUpdate ACTIVE", update.productUpdate.userErrors);
  const publish = await admin(`mutation Publish($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`, { id, input: publications.map((item) => ({ publicationId: item.id })) });
  mutationErrors("publishablePublish", publish.publishablePublish.userErrors);
}

async function targetPublications() {
  const data = await admin(`query Publications { publications(first: 50) { nodes { id name } } }`);
  const targets = data.publications.nodes.filter((item) => item.name === "Online Store" || /headless/i.test(item.name));
  if (!targets.some((item) => item.name === "Online Store") || !targets.some((item) => /headless/i.test(item.name))) throw new Error("Online Store and Headless publications were not both found.");
  return targets;
}

async function waitForMedia(id) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const product = await inspectProduct(id);
    if (product.media.nodes.length >= 30 && product.media.nodes.every((item) => item.status === "READY")) return;
    if (product.media.nodes.some((item) => item.status === "FAILED")) throw new Error("A Shopify media item failed processing.");
    await delay(5000);
  }
  throw new Error("Shopify media did not become READY within five minutes.");
}

async function waitForPublishedProduct(id, groups) {
  let product;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    product = await inspectProduct(id);
    try {
      assertProduct(product, groups, { published: true });
      return product;
    } catch (error) {
      if (attempt === 19) throw error;
      await delay(3000);
    }
  }
  return product;
}

async function verifyStorefront(handle, editorial) {
  const url = `https://dollwow.com/products/${handle}`;
  let status = 0;
  let html = "";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`${url}?v=${Date.now()}-${attempt}`, { redirect: "follow", headers: { "cache-control": "no-cache" } });
    status = response.status;
    html = await response.text();
    if (status === 200 && /SELECT HEAD/i.test(html)) break;
    await delay(5000);
  }
  if (status !== 200) throw new Error(`Storefront GET returned HTTP ${status}.`);
  const customizer = /product-builder|custom-step-|product-option-grid/.test(html) && /SELECT HEAD/i.test(html);
  if (!customizer) throw new Error("Customizer markers are absent from server-rendered HTML.");
  const customState = /\\\"stockStatus\\\":\\\"custom\\\"/.test(html) &&
    /\\\"readyToShip\\\":false/.test(html) &&
    /\\\"customAvailable\\\":true/.test(html) &&
    /\\\"warehouseCountry\\\":\\\"\$undefined\\\"/.test(html);
  if (!customState) throw new Error("The target PDP did not expose the expected custom / readyToShip=false / no-warehouse state.");
  const editorialLive = /pdp-editorial-preview/.test(html) && html.includes(editorial.heading) && html.includes(editorial.eyebrow);
  if (!editorialLive) throw new Error("The approved pdp-editorial-fantasy-v5 magazine block is absent from server-rendered HTML.");
  return { status, html, customizer, editorial: editorialLive, dollVue: /Preview with DollVue|DollVue<sup/i.test(html) };
}

async function applyEditorial(ownerId) {
  const payload = JSON.parse(await fs.readFile(EDITORIAL_PATH, "utf8"));
  const result = (payload.results || []).find((item) => item.handle === HANDLE);
  if (!result?.publishable || result.provenance?.promptVersion !== "pdp-editorial-fantasy-v5" || !result.draft?.eyebrow || !result.draft?.heading || !result.draft?.paragraph) {
    throw new Error("Nadia editorial did not pass the pdp-editorial-fantasy-v5 gates.");
  }
  const value = {
    eyebrow: result.draft.eyebrow,
    heading: result.draft.heading,
    paragraph: result.draft.paragraph,
    promptVersion: "pdp-editorial-fantasy-v5",
    generatedAt: result.provenance.generatedAt || new Date().toISOString()
  };
  const data = await admin(`mutation Editorial($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message code } } }`, {
    metafields: [{ ownerId, namespace: "custom", key: "editorial_intro", type: "json", value: JSON.stringify(value) }]
  });
  mutationErrors("editorial metafieldsSet", data.metafieldsSet.userErrors);
  return value;
}

async function verifyDefaultCart(variantId) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-storefront-access-token": process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
    body: JSON.stringify({ query: `mutation Cart($input: CartInput!) { cartCreate(input: $input) { cart { cost { totalAmount { amount currencyCode } } lines(first: 1) { nodes { cost { amountPerQuantity { amount currencyCode } } } } } userErrors { field message } } }`, variables: { input: { lines: [{ merchandiseId: variantId, quantity: 1 }] } } })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`Default cart request failed: HTTP ${response.status}.`);
  mutationErrors("cartCreate", payload.data.cartCreate.userErrors);
  const cart = payload.data.cartCreate.cart;
  const base = cart.lines.nodes[0]?.cost?.amountPerQuantity;
  if (Number(base?.amount) !== 2811) throw new Error(`Default cart base is ${base?.amount}, expected 2811.`);
  return { baseAmount: Number(base.amount).toFixed(2), currencyCode: base.currencyCode, totalAmount: Number(cart.cost.totalAmount.amount).toFixed(2) };
}

function assertReferenceUnchanged(before, after) {
  const beforeVariant = before.variants.nodes[0];
  const afterVariant = after.variants.nodes[0];
  if (before.id !== after.id || before.handle !== after.handle || before.status !== after.status || beforeVariant.price !== afterVariant.price || before.media.nodes.length !== after.media.nodes.length) {
    throw new Error("Protected Belle custom reference changed unexpectedly.");
  }
}

async function findByHandle(handle) {
  const data = await admin(`query Find($query: String!) { products(first: 10, query: $query) { nodes { id handle title status } } }`, { query: `handle:${handle}` });
  return data.products.nodes.find((item) => item.handle === handle) || null;
}

async function inspectProduct(id) {
  const data = await admin(`query Inspect($id: ID!) { product(id: $id) { id handle title status vendor productType tags descriptionHtml seo { title description } variants(first: 5) { nodes { id price compareAtPrice sku inventoryPolicy inventoryItem { tracked } } } media(first: 100) { nodes { id status mediaContentType alt } } resourcePublications(first: 30) { nodes { publication { id name } isPublished } } customizationGroups: metafield(namespace: "custom", key: "customization_groups") { type value } stockStatus: metafield(namespace: "custom", key: "stock_status") { type value } customAvailable: metafield(namespace: "custom", key: "custom_available") { type value } cupSize: metafield(namespace: "custom", key: "cup_size") { type value } warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { type value } editorialIntro: metafield(namespace: "custom", key: "editorial_intro") { type value } } }`, { id });
  if (!data.product) throw new Error(`Shopify product not found: ${id}`);
  return data.product;
}

function metafield(namespace, key, value, type = "single_line_text_field") {
  return { namespace, key, value: String(value), type };
}

function parseGroups(value) {
  if (!value) return [];
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed : [];
}

function publishedNames(product) {
  return product.resourcePublications.nodes.filter((item) => item.isPublished).map((item) => item.publication.name);
}

function mutationErrors(name, errors = []) {
  if (errors.length) throw new Error(`${name}: ${errors.map((error) => `${Array.isArray(error.field) ? error.field.join(".") : error.field || ""}${error.field ? ": " : ""}${error.message}`).join("; ")}`);
}

async function admin(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, "");
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-access-token": await getAdminToken(domain) },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`Shopify Admin GraphQL HTTP ${response.status}: ${payload.errors?.map((item) => item.message).join("; ") || "unknown error"}`);
  return payload.data;
}

async function getAdminToken(domain) {
  if (tokenCache) return tokenCache;
  if (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET) {
    const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET })
    });
    const payload = await response.json();
    if (response.ok && payload.access_token) return (tokenCache = payload.access_token);
  }
  const fallback = process.env.SHOPIFY_APP_AUTOMATION_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (fallback) return (tokenCache = fallback);
  throw new Error("Shopify Admin authentication is missing.");
}

async function loadEnv() {
  const text = await fs.readFile(ENV_SOURCE, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    let value = line.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[line.slice(0, index).trim()] ||= value;
  }
}

function assertCredentials() {
  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) throw new Error("Shopify store or Storefront API credentials are missing.");
  if (!(process.env.SHOPIFY_APP_AUTOMATION_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || (process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET))) throw new Error("Shopify Admin credentials are missing.");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

async function mapLimit(items, limit, worker) {
  const output = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      output[index] = await worker(items[index], index);
    }
  }));
  return output;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
