import { parseMoney } from "@/lib/utils/currency";
import type { ParsedListing } from "@/types/comparison";

function matchContent(html: string, regex: RegExp) {
  return html.match(regex)?.[1]?.trim().replace(/\s+/g, " ");
}

function matchAllContent(html: string, regex: RegExp, limit = 8) {
  return [...html.matchAll(regex)]
    .map((match) => match[1]?.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, limit) as string[];
}

function extractJsonLd(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const json = JSON.parse(script[1].trim());
      const items = Array.isArray(json) ? json : [json];
      const product = items.find((item) => String(item["@type"] ?? "").toLowerCase().includes("product"));
      if (product) return product;
    } catch {
      // Ignore malformed merchant markup.
    }
  }
  return null;
}

export function extractProductFromHtml(html: string, inputUrl: string): ParsedListing {
  const url = new URL(inputUrl);
  const jsonLd = extractJsonLd(html);
  const title =
    jsonLd?.name ??
    matchContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    matchContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const image =
    jsonLd?.image?.[0] ??
    jsonLd?.image ??
    matchContent(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const offer = Array.isArray(jsonLd?.offers) ? jsonLd.offers[0] : jsonLd?.offers;
  const description =
    jsonLd?.description ??
    matchContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    matchContent(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const prices = extractVisiblePrices(html);
  const offerPrice = parseMoney(offer?.price);
  const price = offerPrice ?? prices[0] ?? parseMoney(matchContent(html, /\$[\s]*([0-9][0-9,.]+)/));
  const salePrice = offerPrice ? extractComparableSalePrice(prices, offerPrice) : prices.length > 1 ? Math.min(...prices) : null;
  const promoText = extractPromoText(html);
  const couponCode = matchContent(html, /\b(?:code|coupon|promo)\s*:?\s*([A-Z0-9]{4,18})\b/i);
  const couponPercent = numberMatch(html, /\b([1-9][0-9]?)\s*%\s*off\b/i);
  const couponFixedAmount = numberMatch(html, /\$\s*([1-9][0-9,.]*)\s*off\b/i);
  const freeShipping = /free\s+(?:standard\s+)?shipping/i.test(html);
  const freebies = matchAllContent(html, /\b(free\s+(?:wig|outfit|care\s+kit|accessor(?:y|ies)|shipping|head|stand)[^<.]{0,80})/gi, 6);
  const stockStatus = matchContent(html, /\b(in stock|out of stock|available on backorder|pre-?order|ready to ship)\b/i);

  return {
    inputUrl,
    sourceDomain: url.hostname.replace(/^www\./, ""),
    title,
    description,
    price,
    salePrice,
    currency: offer?.priceCurrency ?? "USD",
    imageUrls: image ? [String(image)] : [],
    vendor: jsonLd?.brand?.name ?? jsonLd?.brand ?? url.hostname.replace(/^www\./, ""),
    deliveryClaim: matchContent(html, /(free shipping|ships in [^<.]+|delivery [^<.]+)/i),
    stockStatus,
    couponCode,
    couponPercent,
    couponFixedAmount,
    freeShipping,
    freebies,
    promoText,
    extractionConfidence: title && price ? "medium" : "low",
    lastCheckedAt: new Date().toISOString()
  };
}

function extractComparableSalePrice(prices: number[], offerPrice: number) {
  const candidates = prices
    .filter((value) => value >= offerPrice * 0.75 && value <= offerPrice * 1.5)
    .sort((a, b) => a - b);
  const lower = candidates.filter((value) => value < offerPrice);
  return lower.length ? lower[0] : null;
}

function extractVisiblePrices(html: string) {
  return [...html.matchAll(/\$\s*([0-9][0-9,.]+)/g)]
    .map((match) => parseMoney(match[1]))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    .filter((value) => value > 100)
    .slice(0, 12);
}

function extractPromoText(html: string) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  return [
    ...matchAllContent(text, /\b([^.!?]{0,60}(?:coupon|promo|code|sale|discount|free shipping|free gift|free accessory|limited time)[^.!?]{0,100})[.!?]?/gi, 8)
  ].map((item) => item.trim());
}

function numberMatch(html: string, regex: RegExp) {
  const match = html.match(regex)?.[1];
  if (!match) return undefined;
  const value = Number(String(match).replace(/,/g, ""));
  return Number.isFinite(value) ? value : undefined;
}
