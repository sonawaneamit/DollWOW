const exactPublicPaths = new Set([
  "/",
  "/adult-only",
  "/authorized-vendors",
  "/best-price-guarantee",
  "/brands",
  "/buyer-protection",
  "/care-for-life",
  "/compare",
  "/customize",
  "/dollvue",
  "/faq",
  "/factory-photos",
  "/help-me-choose",
  "/how-ordering-works",
  "/learn",
  "/price-match",
  "/promo",
  "/privacy-policy",
  "/returns",
  "/reviews",
  "/scam-alert",
  "/shipping",
  "/shipping-protection",
  "/shop",
  "/supplier",
  "/support",
  "/warehouse",
  "/why-dollwow"
]);

const publicPathPatterns = [
  /^\/brands\/[^/]+$/,
  /^\/learn\/[^/]+$/,
  /^\/products\/[^/]+$/,
  /^\/shop\/[^/]+$/
];

export function isPublicMarkdownPath(pathname: string) {
  const normalized = normalizePublicPath(pathname);
  return exactPublicPaths.has(normalized) || publicPathPatterns.some((pattern) => pattern.test(normalized));
}

export function normalizePublicPath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  const withoutQuery = pathname.split(/[?#]/, 1)[0];
  const normalized = `/${withoutQuery.split("/").filter(Boolean).map((part) => encodeURIComponent(decodeURIComponent(part))).join("/")}`;
  return normalized.replace(/\/$/, "") || "/";
}

export function markdownPathFor(pathname: string) {
  const normalized = normalizePublicPath(pathname);
  return normalized === "/" ? "/markdown" : `/markdown${normalized}`;
}

export function canonicalPathFromMarkdownSegments(segments?: string[]) {
  if (!segments?.length) return "/";
  return normalizePublicPath(`/${segments.join("/")}`);
}
