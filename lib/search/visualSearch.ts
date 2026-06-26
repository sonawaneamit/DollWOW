import { productPublicTitle } from "@/lib/catalog/naming";
import { rankCatalogProducts } from "@/lib/search/catalog";
import { env } from "@/lib/utils/env";
import type { Product } from "@/types/product";
import type { VisualSearchCatalogSuggestion, VisualSearchResult } from "@/types/visualSearch";

const DEFAULT_APIFY_GOOGLE_LENS_ACTOR_ID = "borderline~google-lens";

type ApifyLensInput = {
  imageUrl: string;
  searchTypes?: Array<"visual-match" | "exact-match" | "products">;
};

export async function runApifyVisualSearch(input: ApifyLensInput) {
  if (!env.APIFY_API_TOKEN) {
    throw new Error("APIFY_API_TOKEN is required for visual search.");
  }

  const actorId = env.APIFY_GOOGLE_LENS_ACTOR_ID || DEFAULT_APIFY_GOOGLE_LENS_ACTOR_ID;
  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(env.APIFY_API_TOKEN)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(18000),
    body: JSON.stringify({
      searchTypes: input.searchTypes?.length ? input.searchTypes : ["visual-match", "exact-match", "products"],
      imageUrls: [{ url: input.imageUrl }]
    })
  });

  if (!response.ok) {
    throw new Error(`Apify visual search failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as unknown;
  return normalizeApifyVisualSearchPayload(payload);
}

export function normalizeApifyVisualSearchPayload(payload: unknown): VisualSearchResult[] {
  const items = Array.isArray(payload) ? payload : payload ? [payload] : [];
  const flattened = items.flatMap((item) => flattenApifyResultItem(item));

  return flattened
    .map((item, index) => normalizeResultCandidate(item, index))
    .filter((item): item is VisualSearchResult => Boolean(item));
}

export function buildCatalogSuggestions(products: Product[], results: VisualSearchResult[], limit = 6): VisualSearchCatalogSuggestion[] {
  const localSuggestions = buildLocalVisualCatalogSuggestions(products, results, limit);
  if (localSuggestions.length) return localSuggestions;

  const query = results
    .slice(0, 6)
    .map((result) => [result.title, result.snippet].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" ");

  if (!query.trim()) return [];

  return rankCatalogProducts(products, query, limit).map(({ product, score }) => ({
    productId: product.id,
    handle: product.handle,
    title: productPublicTitle(product),
    brand: product.extended.brand || product.vendor,
    score,
    imageUrl: product.featuredImage?.url
  }));
}

export function buildLocalVisualCatalogSuggestions(products: Product[], results: VisualSearchResult[], limit = 6): VisualSearchCatalogSuggestion[] {
  const byHandle = new Map(products.map((product) => [product.handle, product]));
  const suggestions: VisualSearchCatalogSuggestion[] = [];

  for (const result of results) {
    const raw = result.rawResult as Record<string, unknown> | undefined;
    if (!["dollwow_local_visual_index", "openai_visual_rerank"].includes(String(raw?.provider)) || typeof raw?.handle !== "string") continue;
    const product = byHandle.get(raw.handle);
    if (!product || suggestions.some((suggestion) => suggestion.handle === product.handle)) continue;
    suggestions.push({
      productId: product.id,
      handle: product.handle,
      title: productPublicTitle(product),
      brand: product.extended.brand || product.vendor,
      score: 100,
      imageUrl: product.featuredImage?.url
    });
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

export function buildImageUrlCatalogSuggestions(products: Product[], imageUrl: string, limit = 6): VisualSearchCatalogSuggestion[] {
  let parsed: URL | null = null;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return [];
  }

  const query = `${parsed.hostname.replace(/^www\./, "")} ${parsed.pathname.replace(/[-_/]+/g, " ")}`.trim();
  if (!query) return [];

  return rankCatalogProducts(products, query, limit).map(({ product, score }) => ({
    productId: product.id,
    handle: product.handle,
    title: productPublicTitle(product),
    brand: product.extended.brand || product.vendor,
    score,
    imageUrl: product.featuredImage?.url
  }));
}

function normalizeResultCandidate(item: Record<string, unknown>, index: number): VisualSearchResult | null {
  const resultUrl =
    firstString([
      item.resultUrl,
      item.result_url,
      item.url,
      item.link,
      item.pageUrl,
      item.page_url,
      item.sourceUrl,
      item.source_url,
      nested(item, ["source", "url"]),
      nested(item, ["link", "url"])
    ]) || "";

  const parsed = safePublicUrl(resultUrl);
  if (!parsed) return null;

  const title = firstString([
    item.title,
    item.heading,
    item.name,
    item.text,
    item.sourceTitle,
    item.source_title,
    nested(item, ["source", "title"])
  ]);

  const snippet = firstString([
    item.snippet,
    item.description,
    item.caption,
    item.summary,
    item.textSnippet,
    item.text_snippet
  ]);

  const imageUrl = firstString([
    item.imageUrl,
    item.image_url,
    item.thumbnail,
    item.thumbnailUrl,
    item.thumbnail_url,
    item.image,
    nested(item, ["image", "url"]),
    nested(item, ["thumbnail", "url"])
  ]);

  return {
    rank: positiveInteger(item.rank) ?? index + 1,
    resultUrl: parsed.toString(),
    resultDomain: parsed.hostname.replace(/^www\./, ""),
    title: title || undefined,
    snippet: snippet || undefined,
    imageUrl: safePublicUrl(imageUrl || "")?.toString(),
    confidence: normalizeConfidence(item.confidence, index),
    rawResult: item
  };
}

function flattenApifyResultItem(item: unknown): Record<string, unknown>[] {
  if (!item || typeof item !== "object" || Array.isArray(item)) return [];
  const record = item as Record<string, unknown>;
  const directCandidates = [record];
  const nestedCandidates = [
    ...toRecordArray(record.visualMatches),
    ...toRecordArray(record.visual_matches),
    ...toRecordArray(record.exactMatches),
    ...toRecordArray(record.exact_matches),
    ...toRecordArray(record.products),
    ...toRecordArray(record.shoppingResults),
    ...toRecordArray(record.shopping_results),
    ...toRecordArray(record.organicResults),
    ...toRecordArray(record.organic_results)
  ];
  return nestedCandidates.length ? nestedCandidates : directCandidates;
}

function toRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function nested(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;
  for (const segment of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" ? current : undefined;
}

function firstString(values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function positiveInteger(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : null;
}

function normalizeConfidence(value: unknown, index: number) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return Math.max(0, Math.min(1, numeric));
  return Number(Math.max(0.15, 1 - index * 0.12).toFixed(2));
}

function safePublicUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}
