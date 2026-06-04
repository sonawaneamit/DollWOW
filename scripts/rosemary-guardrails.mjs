const EXCLUSIVE_PATTERNS = [
  {
    type: "rosemary-exclusive",
    regex: /\brosemary(?:\s*doll)?\s+exclusive\b|\bexclusive\s+(?:to|only\s+(?:for|at|on)|available\s+only\s+(?:at|on))\s+rosemary(?:\s*doll)?\b/i
  },
  {
    type: "exclusive-doll",
    regex: /\b(?:exclusive|limited)\s+(?:edition\s+)?(?:sex\s+)?doll\b/i
  },
  {
    type: "likeness-rights",
    regex: /\b(?:celebrity|influencer|model)\s+(?:likeness|collaboration|collab|inspired)\b|\blicensed\s+likeness\b/i
  }
];

const SOURCE_COPY_PATTERNS = [
  /\bRosemaryDoll\b/gi,
  /\bRosemary\s+Doll\b/gi,
  /\brosemarydoll\.com\b/gi,
  /\bRosemary\b/gi
];

export function findRosemaryExclusiveSignals(product) {
  const text = reviewText(product);
  const signals = [];

  for (const pattern of EXCLUSIVE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match?.index !== undefined) {
      signals.push({
        type: pattern.type,
        excerpt: excerptAround(text, match.index, match[0].length)
      });
    }
  }

  return uniqueBy(signals, (signal) => `${signal.type}:${signal.excerpt.toLowerCase()}`);
}

export function isRosemaryExclusive(product) {
  return findRosemaryExclusiveSignals(product).length > 0;
}

export function toDollWowImportProduct(product) {
  const exclusiveSignals = product.reviewFlags?.exclusiveSignals?.length
    ? product.reviewFlags.exclusiveSignals
    : findRosemaryExclusiveSignals(product);
  const sourceTitle = cleanText(product.sourceTitle || product.title);
  const sourceHandle = cleanText(product.sourceHandle || product.handle);
  const title = rewriteDollWowTitle(product);
  const handle = rewriteDollWowHandle(product, title);

  return {
    ...product,
    sourceTitle,
    sourceHandle,
    handle,
    title,
    description: buildDollWowDescription(product),
    reviewFlags: {
      ...(product.reviewFlags || {}),
      exclusiveSignals,
      sourceCopyRewritten: title !== sourceTitle || cleanText(product.description) !== buildDollWowDescription(product)
    },
    excludedFromDollWow: exclusiveSignals.length > 0
  };
}

export function rewriteDollWowTitle(product) {
  const sourceTitle = cleanSourceTitle(product.title);
  const brand = cleanBrandLabel(product.brand || product.brandSlug || "");
  const material = titleCase(inferMaterial(product));
  const height = product.specs?.heightCm ? `${product.specs.heightCm}cm` : extractHeight(sourceTitle);
  const cup = cleanCup(product.specs?.cupSize || extractCup(sourceTitle));
  const name = extractDollName(sourceTitle);
  const prefix = name || brand || "DollWow";
  const details = [height, cup ? `${cup}-Cup` : "", material && material !== "Adult Doll" ? material : "", "Companion Doll"].filter(Boolean);

  return preserveProductAcronyms(cleanText(`${prefix} ${details.join(" ")}`));
}

export function rewriteDollWowHandle(product, title = rewriteDollWowTitle(product)) {
  const brand = slugify(product.brandSlug || product.brand || "");
  const base = slugify(title);
  const sourceHandle = slugify(product.sourceHandle || product.handle || "");
  const suffix = shortStableSuffix(sourceHandle || base);
  return uniqueSlugParts([brand, base, suffix]).join("-");
}

export function buildDollWowDescription(product) {
  const brand = cleanBrandLabel(product.brand || product.brandSlug || "supplier");
  const material = inferMaterial(product).toLowerCase();
  const height = product.specs?.heightCm ? `${product.specs.heightCm} cm` : "";
  const cup = cleanCup(product.specs?.cupSize || "");
  const availability =
    product.stockStatus === "ready_to_ship"
      ? product.warehouseCountry
        ? `with ${product.warehouseCountry} warehouse availability to verify`
        : "with ready-to-ship availability to verify"
      : "for a made-to-order custom build";
  const specPhrase = [height, cup ? `${cup}-cup` : "", material && material !== "adult doll" ? material : "adult"].filter(Boolean).join(" ");
  const optionPhrase = product.customAvailable
    ? " The DollWow configurator highlights compatible options, visual references, and price impacts before checkout."
    : " The listed configuration is reviewed for stock, timing, and final product details before checkout.";

  return cleanText(
    `A ${brand} ${specPhrase} companion doll prepared by DollWow ${availability}. We keep the core supplier specs visible, add clearer buying guidance, and confirm availability, options, and discreet fulfillment details before the order moves forward.${optionPhrase}`
  );
}

export function reviewWarningsForRosemaryProduct(product) {
  const warnings = [];
  const signals = product.reviewFlags?.exclusiveSignals || findRosemaryExclusiveSignals(product);
  for (const signal of signals) {
    warnings.push(`${product.handle || "unknown"}: blocked possible Rosemary exclusive (${signal.type}: ${signal.excerpt})`);
  }
  if (hasSourceCopy(product.title) || hasSourceCopy(product.description)) {
    warnings.push(`${product.handle || "unknown"}: source brand copy should be rewritten before import`);
  }
  return warnings;
}

function reviewText(product) {
  return cleanText(
    [
      product.title,
      product.sourceTitle,
      product.description,
      product.html ? stripHtml(product.html) : "",
      ...(product.optionGroupLabels || []),
      ...(product.optionGroups || []).flatMap((group) => [group.label, ...(group.options || []).map((option) => option.label)])
    ].join(" ")
  );
}

function cleanSourceTitle(title) {
  return cleanText(String(title || "").replace(/\s+-\s+RosemaryDoll$/i, "").replace(/\s*\[[^\]]+\]\s*/g, " "));
}

function extractDollName(title) {
  const clean = cleanSourceTitle(title);
  const dashName = clean.match(/\s[-–]\s([^()|]+?)(?:\s*\([^)]*\))?$/)?.[1];
  if (dashName) return titleCase(cleanText(dashName.replace(/\b(?:wm|zelex|irontech|anglekiss|dolls?)\b/gi, "")));
  const trailingName = clean.match(/\b(?:Doll|Torso)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)$/)?.[1];
  return trailingName ? titleCase(trailingName) : "";
}

function extractHeight(title) {
  return title.match(/\b([0-9]{2,3})\s*cm\b/i)?.[1] ? `${title.match(/\b([0-9]{2,3})\s*cm\b/i)[1]}cm` : "";
}

function extractCup(title) {
  return title.match(/\b([A-Z]{1,2})\s*-?\s*Cup\b/i)?.[1] || "";
}

function cleanCup(value) {
  return cleanText(value).replace(/\s*cup$/i, "").toUpperCase();
}

function inferMaterial(product) {
  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  if (text.includes("silicone head")) return "Silicone Head";
  if (text.includes("silicone")) return "Silicone";
  if (text.includes("tpe")) return "TPE";
  return "Adult Doll";
}

function cleanBrandLabel(value) {
  const text = titleCase(cleanText(value).replace(/-/g, " "));
  return preserveProductAcronyms(text);
}

function preserveProductAcronyms(value) {
  return String(value || "").replace(/\bWm\b/g, "WM").replace(/\bTpe\b/g, "TPE");
}

function hasSourceCopy(value) {
  return SOURCE_COPY_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(String(value || ""));
  });
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function excerptAround(text, index, length) {
  const start = Math.max(0, index - 55);
  const end = Math.min(text.length, index + length + 55);
  return cleanText(`${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`);
}

function uniqueBy(values, keyFor) {
  const seen = new Set();
  return values.filter((value) => {
    const key = keyFor(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSlugParts(values) {
  const parts = values.map(slugify).filter(Boolean);
  const seen = new Set();
  return parts.filter((part) => {
    if (seen.has(part)) return false;
    seen.add(part);
    return true;
  });
}

function shortStableSuffix(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash.toString(36).slice(0, 5).padStart(5, "0");
}

function titleCase(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
