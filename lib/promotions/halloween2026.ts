export const HALLOWEEN_2026 = {
  id: "halloween-2026",
  code: "HALLOWEEN299",
  amountUsd: 299,
  startsAt: "2026-10-21T16:09:00Z",
  endsAt: "2026-11-08T23:59:00Z",
  endLabel: "8 November 2026 at 23:59 Portugal time",
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

export function isHalloweenInWindow(now = Date.now()) {
  return now >= Date.parse(HALLOWEEN_2026.startsAt) && now < Date.parse(HALLOWEEN_2026.endsAt);
}

// Martin approved production on 21 October. Setting this flag to 0 is the
// emergency visual kill switch; Shopify's independent endsAt ends redemption.
export function isHalloweenVisible(environment: NodeJS.ProcessEnv = process.env, now = Date.now()) {
  return environment.DOLLWOW_HALLOWEEN_ENABLED !== "0" &&
    (isHalloweenPreview(environment) || isHalloweenInWindow(now));
}

export function isHalloweenSpiderPath(path: string) {
  return path === "/" || path === "/promo" || path === "/reviews" || path === "/shop" || path === "/brands" ||
    /^\/(?:shop|products|brands)\/[^/]+\/?$/.test(path);
}
