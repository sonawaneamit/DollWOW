export const HALLOWEEN_2026 = {
  id: "halloween-2026",
  code: "HALLOWEEN299",
  amountUsd: 299,
  headline: "$299 off full-size dolls this Halloween",
  dismissalKey: "dollwow:halloween-2026:hidden",
  fallbackAtKey: "dollwow:halloween-2026:fallback-at",
  fallbackDelayMs: 30000
} as const;

// This branch can be reviewed without enabling a production campaign or touching
// the existing Shopify discounts. Production activation requires a separate yes.
export function isHalloweenPreview(environment: NodeJS.ProcessEnv = process.env) {
  return environment.VERCEL_ENV !== "production" && (
    environment.DOLLWOW_HALLOWEEN_PREVIEW === "1" ||
    (environment.VERCEL_ENV === "preview" && environment.VERCEL_GIT_COMMIT_REF === "codex/dol-217-halloween-preview")
  );
}

export function isHalloweenSpiderPath(path: string) {
  return path === "/" || path === "/promo" || path === "/reviews" || path === "/shop" || path === "/brands" ||
    /^\/(?:shop|products|brands)\/[^/]+\/?$/.test(path);
}
