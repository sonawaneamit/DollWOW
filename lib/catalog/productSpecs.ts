import type { Product } from "@/types/product";
import { productBodyLabel } from "@/lib/catalog/bodyType";
import { productDisplayNameForUi, productPublicTitle } from "@/lib/catalog/naming";

export type DisplaySpec = {
  label: string;
  value: string;
};

const MEASUREMENT_LABELS = [
  "Height",
  "Weight",
  "Cup size",
  "Bust",
  "Waist",
  "Hip",
  "Shoulders Width",
  "Feet Length",
  "Arms Length",
  "Legs Length",
  "Vagina Depth",
  "Anus Depth",
  "Oral Depth"
];

const CRITICAL_MEASUREMENT_LABELS = new Set(["Height", "Weight", "Cup size", "Bust", "Waist", "Hip"]);

const DESCRIPTION_SPEC_LABELS = [
  "Height",
  "Weight",
  "Material",
  "Bra Size",
  "Cup Size",
  "Cup size",
  "Feet Length",
  "Bust",
  "Legs Length",
  "Waist",
  "Arms Length",
  "Hip",
  "Shoulders Width",
  "Shoulder Width",
  "Vagina Length",
  "Vagina Depth",
  "Anus Length",
  "Anus Depth",
  "Mouth Depth",
  "Oral Depth",
  "Brand",
  "Availability",
  "Warehouse",
  "Delivery"
];
const DESCRIPTION_SPEC_STOP_PHRASES = [
  ...DESCRIPTION_SPEC_LABELS.map((label) => `${escapeRegExp(label)}:`),
  "This doll has\\b",
  "We provide\\b",
  "Also,\\b",
  "Alternatively,\\b",
  "Final availability\\b"
];
const DESCRIPTION_SPEC_LOOKAHEAD = DESCRIPTION_SPEC_STOP_PHRASES.join("|");

export function productHeroIntro(product: Product) {
  const cleaned = cleanDescription(product.description);
  const withoutSpecs = stripCatalogMetadata(stripDescriptionSpecs(cleaned));
  const firstSentence = withoutSpecs.match(/^(.{40,220}?[.!?])\s/)?.[1]?.trim();
  const intro = firstSentence || withoutSpecs.slice(0, 220).trim();

  if (!intro || isMetadataOnlyIntro(intro) || isRedundantWithTitle(product, intro)) {
    return productFallbackIntro(product);
  }

  return intro;
}

export function primaryProductSpecs(product: Product): DisplaySpec[] {
  const measurements = measurementValueMap(product);
  const fallbackHeight = formatHeightDual(product.extended.heightCm) || specFromDescription(product, "Height") || "Confirm";
  const fallbackWeight = formatWeightDual(product.extended.weightLb) || specFromDescription(product, "Weight") || "Confirm";
  return [
    { label: "Material", value: product.extended.material ?? "Confirm" },
    { label: "Delivery", value: product.extended.deliveryEstimate ?? "Confirm" },
    {
      label: "Height",
      value: measurements.get("Height") ?? fallbackHeight
    },
    {
      label: "Weight",
      value: measurements.get("Weight") ?? fallbackWeight
    }
  ];
}

export function detailedProductSpecs(product: Product): DisplaySpec[] {
  const measurementSpecs = measurementRecordSpecs(product.extended.measurements);
  const base = [
    { label: "Brand", value: product.extended.brand ?? product.vendor },
    { label: "Material", value: product.extended.material ?? "" },
    { label: "Height", value: formatHeightDual(product.extended.heightCm) ?? "" },
    { label: "Weight", value: formatWeightDual(product.extended.weightLb) ?? "" },
    { label: "Cup size", value: product.extended.cupSize ?? "" },
    { label: "Delivery", value: product.extended.deliveryEstimate ?? "" }
  ];

  const parsed = descriptionSpecs(product.description);
  const parsedMeasurements = parsed.filter((spec) => isMeasurementLabel(spec.label));
  const parsedDetails = parsed.filter((spec) => !isMeasurementLabel(spec.label) && !["Brand", "Material", "Delivery"].includes(spec.label));
  return dedupeSpecs([...measurementSpecs, ...parsedMeasurements, ...base, ...parsedDetails])
    .filter((spec) => spec.value)
    .slice(0, 18);
}

export function productMeasurementSpecs(product: Product): DisplaySpec[] {
  const parsed = detailedProductSpecs(product);
  const values = new Map(
    parsed
      .filter((spec) => hasMeaningfulMeasurementValue(spec.value))
      .map((spec) => [normalizeMeasurementLabel(spec.label), spec.value])
  );

  return MEASUREMENT_LABELS.map((label) => {
    const normalized = normalizeMeasurementLabel(label);
    const value = values.get(normalized);
    if (value) return { label: normalized, value };
    if (CRITICAL_MEASUREMENT_LABELS.has(normalized)) return { label: normalized, value: "Confirm with team" };
    return null;
  }).filter((spec): spec is DisplaySpec => Boolean(spec));
}

export function descriptionSpecs(description: string): DisplaySpec[] {
  const text = cleanDescription(description);
  return DESCRIPTION_SPEC_LABELS.map((label) => {
    const value = extractSpecValue(text, label);
    return value ? { label: normalizeLabel(label), value } : null;
  }).filter((spec): spec is DisplaySpec => Boolean(spec));
}

function measurementRecordSpecs(measurements?: Record<string, string>): DisplaySpec[] {
  if (!measurements) return [];
  return Object.entries(measurements)
    .map(([label, value]) => ({ label: normalizeMeasurementLabel(label), value: cleanSpecValue(value) || "" }))
    .filter((spec) => spec.value);
}

function measurementValueMap(product: Product) {
  return new Map(measurementRecordSpecs(product.extended.measurements).map((spec) => [normalizeMeasurementLabel(spec.label), spec.value]));
}

function specFromDescription(product: Product, label: string) {
  return descriptionSpecs(product.description).find((spec) => spec.label.toLowerCase() === normalizeLabel(label).toLowerCase())?.value;
}

function stripDescriptionSpecs(description: string) {
  let cleaned = description;
  for (const label of DESCRIPTION_SPEC_LABELS) {
    cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(label)}:\\s*[^:]+?(?=\\s+(?:${DESCRIPTION_SPEC_LOOKAHEAD})|$)`, "gi"), " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

function stripCatalogMetadata(description: string) {
  return description
    .replace(/\bThis doll has\b[^.]*\./gi, " ")
    .replace(/\bFinal availability\b[^.]*\./gi, " ")
    .replace(/\b(head|body)\s*#\w+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMetadataOnlyIntro(intro: string) {
  const withoutUnits = intro
    .replace(/\b(ft|in|cm|kg|lb|lbs|cup|n\/a)\b/gi, " ")
    .replace(/[#/.,:-]/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return withoutUnits.length < 24;
}

function productFallbackIntro(product: Product) {
  const brand = (product.extended.brand || product.vendor || "DollWow").replace(/\s+dolls$/i, "");
  const availability = product.extended.stockStatus === "ready_to_ship" ? "ready-to-ship" : "made-to-order";
  const material = product.extended.material ? product.extended.material : "";
  const height = product.extended.heightCm ? `${product.extended.heightCm} cm` : "";
  const cup = normalizedCupLabel(product.extended.cupSize);
  const bodyLabel = productBodyLabel(product);
  const displayName = productDisplayNameForUi(product);
  const title = productPublicTitle(product);
  const leadName = displayName || title;
  const specParts = [];
  if (height) specParts.push(phraseWithArticle(height, "frame"));
  if (cup) specParts.push(phraseWithArticle(cup, "profile"));
  if (material) specParts.push(phraseWithArticle(material.toLowerCase(), "build"));
  const specPhrase = joinNatural(specParts);
  const customLine = product.extended.customAvailable === false
    ? "The page shows the exact setup included in the base configuration."
    : product.extended.stockStatus === "ready_to_ship"
      ? "Warehouse timing stays upfront so you can compare the base setup, measurements, and shipping before checkout."
      : "The page starts from the factory setup, then shows option, timing, and measurement details before checkout.";

  if (specPhrase) {
    return `${leadName} is a ${availability} ${brand} ${bodyLabel} with ${specPhrase}. ${customLine}`;
  }

  return `${leadName} is a ${availability} ${brand} ${bodyLabel} with measurements, timing, and order details checked before you continue.`;
}

function isRedundantWithTitle(product: Product, intro: string) {
  const title = normalizeForComparison(productPublicTitle(product));
  const introText = normalizeForComparison(intro);
  if (!title || !introText) return false;
  return introText.startsWith(title) || similarityOverlap(title, introText) > 0.72;
}

function extractSpecValue(description: string, label: string) {
  const match = description.match(new RegExp(`\\b${escapeRegExp(label)}:\\s*([^:]+?)(?=\\s+(?:${DESCRIPTION_SPEC_LOOKAHEAD})|$)`, "i"));
  return cleanSpecValue(match?.[1]);
}

function cleanSpecValue(value?: string) {
  return value
    ?.replace(/\bFinal availability\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasMeaningfulMeasurementValue(value?: string) {
  const cleaned = cleanSpecValue(value);
  if (!cleaned) return false;
  return !/^(n\/a|na|not applicable)$/i.test(cleaned);
}

function dedupeSpecs(specs: DisplaySpec[]) {
  const seen = new Set<string>();
  const result: DisplaySpec[] = [];
  for (const spec of specs) {
    const key = spec.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ label: normalizeLabel(spec.label), value: spec.value });
  }
  return result;
}

function normalizeLabel(label: string) {
  if (label === "Bra Size") return "Cup size";
  if (label === "Cup Size") return "Cup size";
  if (label === "Shoulder Width") return "Shoulders width";
  return label;
}

function normalizeMeasurementLabel(label: string) {
  if (label === "Shoulder Width") return "Shoulders Width";
  if (label === "Shoulders width") return "Shoulders Width";
  return normalizeLabel(label);
}

function isMeasurementLabel(label: string) {
  return MEASUREMENT_LABELS.includes(normalizeMeasurementLabel(label));
}

function cleanDescription(description: string) {
  return String(description || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\.([A-Z])/g, ". $1")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeForComparison(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarityOverlap(left: string, right: string) {
  const leftWords = new Set(left.split(" ").filter(Boolean));
  const rightWords = new Set(right.split(" ").filter(Boolean));
  if (!leftWords.size || !rightWords.size) return 0;
  let matches = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) matches += 1;
  }
  return matches / leftWords.size;
}

function normalizedCupLabel(value: string | undefined | null) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "";
  const normalized = cleaned
    .toLowerCase()
    .replace(/(?:-|\/|\s)*cup$/i, "")
    .replace(/[^a-z0-9]+/g, "");
  if (!normalized || ["na", "nacup", "none", "notapplicable", "nocup"].includes(normalized)) return "";
  const match = cleaned.match(/[a-z]{1,3}/i);
  if (!match) return cleaned;
  return `${match[0].toUpperCase()}-Cup`;
}

function joinNatural(parts: string[]) {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function phraseWithArticle(value: string, suffix: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  const article = /^[aeiou]/i.test(text) ? "an" : "a";
  return `${article} ${text} ${suffix}`;
}

function formatHeightDual(heightCm: number | undefined) {
  if (!heightCm || !Number.isFinite(heightCm)) return "";
  const totalInches = heightCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  if (!feet) return `${Math.round(heightCm)} cm`;
  if (!inches) return `${feet} ft / ${Math.round(heightCm)} cm`;
  return `${feet} ft ${inches} in / ${Math.round(heightCm)} cm`;
}

function formatWeightDual(weightLb: number | undefined) {
  if (!weightLb || !Number.isFinite(weightLb)) return "";
  const kilograms = weightLb / 2.20462;
  return `${weightLb.toFixed(1)} lb / ${kilograms.toFixed(1)} kg`;
}
