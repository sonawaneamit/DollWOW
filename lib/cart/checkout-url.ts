const DEFAULT_CHECKOUT_DOMAIN = "checkout.dollwow.com";

export function checkoutDomain() {
  return (process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN || DEFAULT_CHECKOUT_DOMAIN)
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

export function normalizeCheckoutUrl(checkoutUrl: string, domain = checkoutDomain()) {
  if (!checkoutUrl || !domain || checkoutUrl.startsWith("/")) return checkoutUrl;

  try {
    const url = new URL(checkoutUrl);
    const isShopifyCheckoutPath = url.pathname.startsWith("/cart") || url.pathname.startsWith("/checkouts");
    if (!isShopifyCheckoutPath || url.hostname.toLowerCase() === domain.toLowerCase()) return checkoutUrl;

    url.protocol = "https:";
    url.hostname = domain;
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}
