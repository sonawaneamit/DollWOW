import { brandHubHandles } from "@/lib/catalog/brandSeo";
import { collectionPresets, isIndexableShopCollectionHandle } from "@/lib/catalog/filters";
import { getLearningArticles } from "@/lib/learn/content";
import { getSeoCatalogProducts, isCustomerVisibleProduct } from "@/lib/shopify/storefront";
import { brandFromText, getCatalogBrand, normalizeBrandText } from "@/lib/catalog/brands";
import type { Product } from "@/types/product";

// Preview deployments must never advertise preview URLs to search engines.
export const sitemapOrigin = "https://dollwow.com";
export type SitemapEntry = { url: string; lastModified?: string };
export type SitemapSegments = Record<string, SitemapEntry[]>;

const staticRoutes = [
  "",
  "/brands",
  "/promo",
  "/learn",
  "/authors/jesse",
  "/authors/alex",
  "/customize",
  "/warehouse",
  "/help-me-choose",
  "/compare",
  "/why-dollwow",
  "/reviews",
  "/authorized-vendors",
  "/how-ordering-works",
  "/buyer-protection",
  "/care-for-life",
  "/factory-photos",
  "/dollvue",
  "/shop/dollvue-enabled",
  "/best-price-guarantee",
  "/price-match",
  "/scam-alert",
  "/shipping",
  "/shipping-protection",
  "/returns",
  "/privacy-policy",
  "/faq",
  "/support",
  "/supplier",
  "/adult-only",
  "/datasets/sex-doll-size-weight-2026.json"
];

// Live manufacturer with no brand-hub registry entry yet. This must not create
// navigation links to a nonexistent hub as a side effect of sitemap grouping.
const sitemapOnlyBrands = new Map([
  ["lusandy", "lusandy"], ["lusandy doll", "lusandy"], ["lusandy dolls", "lusandy"]
]);

function sitemapBrandValue(value: string | undefined) {
  return getCatalogBrand(value)?.value ?? sitemapOnlyBrands.get(normalizeBrandText(value));
}

export function productSitemapBrand(product: Product) {
  return sitemapBrandValue(product.extended.brand) ?? sitemapBrandValue(product.vendor)
    ?? product.tags.map((tag) => sitemapBrandValue(tag.replace(/^brand:/i, ""))).find(Boolean)
    ?? brandFromText(product.extended.brand, product.vendor)?.value ?? "other";
}

function validDate(value: string | undefined) {
  if (!value || !Number.isFinite(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}

export function buildSitemapSegments(products: Product[]): SitemapSegments {
  const segments: SitemapSegments = {};
  const seen = new Set<string>();
  function add(file: string, path: string, date?: string) {
    const url = `${sitemapOrigin}${path}`;
    if (seen.has(url)) return;
    seen.add(url);
    const lastModified = validDate(date);
    (segments[file] ??= []).push({ url, ...(lastModified ? { lastModified } : {}) });
  }
  for (const path of staticRoutes) {
    add(path.startsWith("/shop/") ? "collections.xml" : "pages.xml", path);
  }
  for (const handle of Object.keys(collectionPresets).sort()) {
    if (!getCatalogBrand(handle) && isIndexableShopCollectionHandle(handle)) {
      add("collections.xml", `/shop/${handle}`);
    }
  }
  for (const handle of [...brandHubHandles].sort()) add("brands.xml", `/brands/${handle}`);
  for (const article of getLearningArticles()) add("learn.xml", `/learn/${article.slug}`, article.lastReviewed);
  for (const product of products.filter(isCustomerVisibleProduct)) {
    if (!product.handle || !/^[a-z0-9][a-z0-9-]*$/i.test(product.handle)) continue;
    add(`products-${productSitemapBrand(product)}.xml`, `/products/${product.handle}`, product.updatedAt);
  }
  for (const entries of Object.values(segments)) entries.sort((a, b) => a.url.localeCompare(b.url));
  return segments;
}

export async function getSitemapSegments() {
  // Only the public Storefront source, never Admin drafts or local import previews.
  const products = await getSeoCatalogProducts({ first: Number.MAX_SAFE_INTEGER, revalidate: 3600, strict: true });
  return buildSitemapSegments(products);
}

export function escapeSitemapXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function renderSitemap(entries: SitemapEntry[]) {
  if (entries.length > 50000) throw new Error("Sitemap requires additional pagination");
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entries.map(({ url, lastModified }) => `  <url><loc>${escapeSitemapXml(url)}</loc>${lastModified ? `<lastmod>${escapeSitemapXml(lastModified)}</lastmod>` : ""}</url>`).join("\n")
    + "\n</urlset>\n";
  if (Buffer.byteLength(body, "utf8") > 50 * 1024 * 1024) throw new Error("Sitemap exceeds size limit");
  return body;
}

export function renderSitemapIndex(segments: SitemapSegments) {
  const urls = Object.keys(segments).filter((file) => segments[file].length).sort()
    .map((file) => `${sitemapOrigin}/sitemaps/${file}`);
  urls.push(`${sitemapOrigin}/sitemap-images.xml`);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((url) => `  <sitemap><loc>${escapeSitemapXml(url)}</loc></sitemap>`).join("\n")
    + "\n</sitemapindex>\n";
}

export function sitemapResponse(body: string) {
  return new Response(body, { headers: {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
  } });
}
