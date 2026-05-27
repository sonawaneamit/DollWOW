export function storefrontAuthHeaders(token: string): Record<string, string> {
  const trimmed = token.trim();
  const looksPrivate = /^shpat_|^shpua_/i.test(trimmed);

  return looksPrivate
    ? { "Shopify-Storefront-Private-Token": trimmed }
    : { "X-Shopify-Storefront-Access-Token": trimmed };
}
