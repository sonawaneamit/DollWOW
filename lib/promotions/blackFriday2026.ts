export const BLACK_FRIDAY_2026 = {
  id: "black-friday-2026",
  code: "BLACKFRIDAYWOW26",
  amountUsd: 299,
  startsAt: "2026-11-27T05:00:00Z", // Thanksgiving morning US Eastern
  endsAt: "2026-12-11T04:59:59Z", // 10 Dec 2026 23:59:59 US Eastern
  headline: "Black Friday: $299 OFF · Code BLACKFRIDAYWOW26 · Shop the deals →",
} as const;

// Preview-only gating: show ONLY on Vercel preview, never production
export function isBlackFridayPreview(environment: NodeJS.ProcessEnv = process.env) {
  return environment.VERCEL_ENV === "preview";
}

export function isBlackFridayInWindow(now = Date.now()) {
  return now >= Date.parse(BLACK_FRIDAY_2026.startsAt) && now < Date.parse(BLACK_FRIDAY_2026.endsAt);
}

// Shows on preview NOW for review, or in production during campaign window
export function isBlackFridayVisible(environment: NodeJS.ProcessEnv = process.env, now = Date.now()) {
  return isBlackFridayPreview(environment) || isBlackFridayInWindow(now);
}
