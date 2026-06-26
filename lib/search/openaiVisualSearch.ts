import { productPublicTitle } from "@/lib/catalog/naming";
import { LOCAL_VISUAL_ASSETS } from "@/lib/search/localVisualIndex";
import { env } from "@/lib/utils/env";
import type { Product } from "@/types/product";
import type { VisualSearchCatalogSuggestion, VisualSearchResult } from "@/types/visualSearch";

const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_CANDIDATE_IMAGES = 12;
const MIN_CONFIDENCE = 0.68;

type VisualCandidate = {
  index: number;
  product: Product;
  imageUrl: string;
  source: "homepage" | "catalog";
};

type OpenAIVisualMatch = {
  index?: unknown;
  confidence?: unknown;
  reason?: unknown;
};

export async function runOpenAIVisualCatalogSearch({
  imageUrl,
  products,
  limit = 6
}: {
  imageUrl: string;
  products: Product[];
  limit?: number;
}): Promise<{ results: VisualSearchResult[]; suggestions: VisualSearchCatalogSuggestion[] }> {
  if (!env.OPENAI_API_KEY) {
    return { results: [], suggestions: [] };
  }

  const candidates = selectVisualCandidateImages(products, MAX_CANDIDATE_IMAGES);
  if (!candidates.length) return { results: [], suggestions: [] };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    signal: AbortSignal.timeout(16000),
    body: JSON.stringify({
      model: env.OPENAI_VISUAL_SEARCH_MODEL || DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "You compare the shopper-uploaded product photo to numbered DollWow catalog candidate images.",
                "The first image is the shopper upload. Every image after that is one candidate in the same order as the JSON list below.",
                "Return JSON only: {\"matches\":[{\"index\":1,\"confidence\":0.0,\"reason\":\"short visual reason\"}]}",
                "Choose only candidates that appear to show the same doll/product identity, face, body, or the same DollWow styled hero photo.",
                "Similar hair color, pose, clothing, or cup size alone is not enough. If there is no strong visual match, return {\"matches\":[]}.",
                "",
                "Candidates:",
                JSON.stringify(
                  candidates.map((candidate) => ({
                    index: candidate.index,
                    title: productPublicTitle(candidate.product),
                    brand: candidate.product.extended.brand || candidate.product.vendor,
                    handle: candidate.product.handle,
                    source: candidate.source
                  }))
                )
              ].join("\n")
            },
            imagePart(imageUrl),
            ...candidates.map((candidate) => imagePart(candidate.imageUrl))
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI visual search failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content || "{}";
  const matches = parseMatches(content)
    .map((match) => normalizeOpenAIMatch(match))
    .filter((match): match is { index: number; confidence: number; reason?: string } => Boolean(match))
    .filter((match) => match.confidence >= MIN_CONFIDENCE);

  const byIndex = new Map(candidates.map((candidate) => [candidate.index, candidate]));
  const seenHandles = new Set<string>();
  const suggestions: VisualSearchCatalogSuggestion[] = [];
  const results: VisualSearchResult[] = [];

  for (const match of matches) {
    const candidate = byIndex.get(match.index);
    if (!candidate || seenHandles.has(candidate.product.handle)) continue;
    seenHandles.add(candidate.product.handle);

    const score = Math.round(match.confidence * 100);
    suggestions.push({
      productId: candidate.product.id,
      handle: candidate.product.handle,
      title: productPublicTitle(candidate.product),
      brand: candidate.product.extended.brand || candidate.product.vendor,
      score,
      imageUrl: candidate.product.featuredImage?.url || candidate.imageUrl
    });

    const resultUrl = new URL(`/products/${candidate.product.handle}`, env.NEXT_PUBLIC_SITE_URL);
    results.push({
      rank: results.length + 1,
      resultUrl: resultUrl.toString(),
      resultDomain: resultUrl.hostname.replace(/^www\./, ""),
      title: productPublicTitle(candidate.product),
      snippet: match.reason || "Matched from the uploaded photo.",
      imageUrl: candidate.imageUrl,
      confidence: match.confidence,
      rawResult: {
        provider: "openai_visual_rerank",
        handle: candidate.product.handle,
        candidateIndex: candidate.index,
        source: candidate.source
      }
    });

    if (suggestions.length >= limit) break;
  }

  return { results, suggestions };
}

export function selectVisualCandidateImages(products: Product[], maxImages = MAX_CANDIDATE_IMAGES): VisualCandidate[] {
  const byHandle = new Map(products.map((product) => [product.handle, product]));
  const candidates: VisualCandidate[] = [];
  const seenProductImage = new Set<string>();

  const addCandidate = (product: Product | undefined, imageUrl: string | undefined, source: VisualCandidate["source"]) => {
    if (!product || !imageUrl || candidates.length >= maxImages) return;
    const key = `${product.handle}:${imageUrl}`;
    if (seenProductImage.has(key)) return;
    seenProductImage.add(key);
    candidates.push({
      index: candidates.length + 1,
      product,
      imageUrl,
      source
    });
  };

  for (const asset of LOCAL_VISUAL_ASSETS) {
    const product = byHandle.get(asset.productHandle);
    addCandidate(product, publicAssetUrl(asset.assetPath), "homepage");
    addCandidate(product, product?.featuredImage?.url, "catalog");
    for (const image of product?.images.slice(0, 2) || []) {
      addCandidate(product, image.url, "catalog");
    }
  }

  for (const product of products) {
    addCandidate(product, product.featuredImage?.url, "catalog");
    if (candidates.length >= maxImages) break;
  }

  return candidates;
}

function imagePart(url: string) {
  return {
    type: "image_url",
    image_url: {
      url,
      detail: "low"
    }
  };
}

function publicAssetUrl(assetPath: string) {
  const publicSite = new URL(env.NEXT_PUBLIC_SITE_URL);
  const assetOrigin =
    env.ADMIN_APP_URL || (publicSite.hostname === "dollwow.com" || publicSite.hostname === "www.dollwow.com" ? "https://ops.dollwow.com" : env.NEXT_PUBLIC_SITE_URL);
  return new URL(assetPath, assetOrigin).toString();
}

function parseMatches(content: string): OpenAIVisualMatch[] {
  try {
    const parsed = JSON.parse(content) as { matches?: OpenAIVisualMatch[] };
    return Array.isArray(parsed.matches) ? parsed.matches : [];
  } catch {
    return [];
  }
}

function normalizeOpenAIMatch(match: OpenAIVisualMatch) {
  const index = Number(match.index);
  const confidence = Number(match.confidence);
  if (!Number.isInteger(index) || index < 1 || !Number.isFinite(confidence)) return null;
  const reason = typeof match.reason === "string" ? match.reason.slice(0, 160) : undefined;
  return {
    index,
    confidence: Math.max(0, Math.min(1, confidence)),
    ...(reason ? { reason } : {})
  };
}
