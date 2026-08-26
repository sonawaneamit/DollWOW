/**
 * Safe product URL generation to prevent /products/null, /dollvue/null, etc.
 * when product handles are missing or invalid.
 */

export function productUrl(handle: string | null | undefined): string {
  if (!handle || handle === "null" || handle === "undefined") {
    return "/shop/sex-dolls";
  }
  return `/products/${handle}`;
}

export function dollVueUrl(handle: string | null | undefined): string {
  if (!handle || handle === "null" || handle === "undefined") {
    return "/dollvue";
  }
  return `/dollvue/${handle}`;
}

export function isValidHandle(handle: string | null | undefined): handle is string {
  return Boolean(handle && handle !== "null" && handle !== "undefined");
}
