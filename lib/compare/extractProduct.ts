import { parseMoney } from "@/lib/utils/currency";
import type { ParsedListing } from "@/types/comparison";

function matchContent(html: string, regex: RegExp) {
  return html.match(regex)?.[1]?.trim().replace(/\s+/g, " ");
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
  const price = parseMoney(offer?.price ?? matchContent(html, /\$[\s]*([0-9][0-9,.]+)/));

  return {
    inputUrl,
    sourceDomain: url.hostname.replace(/^www\./, ""),
    title,
    price,
    currency: offer?.priceCurrency ?? "USD",
    imageUrls: image ? [String(image)] : [],
    vendor: jsonLd?.brand?.name ?? jsonLd?.brand ?? url.hostname.replace(/^www\./, ""),
    deliveryClaim: matchContent(html, /(free shipping|ships in [^<.]+|delivery [^<.]+)/i),
    lastCheckedAt: new Date().toISOString()
  };
}
