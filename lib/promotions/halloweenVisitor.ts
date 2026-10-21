import { HALLOWEEN_2026 } from "./halloween2026";

type VisitorStorage = Pick<Storage, "getItem" | "setItem">;

export function halloweenFallbackDeadline(storage: VisitorStorage, now: number) {
  const stored = Number(storage.getItem(HALLOWEEN_2026.fallbackAtKey));
  if (Number.isFinite(stored) && stored > 0) return stored;
  const deadline = now + HALLOWEEN_2026.fallbackDelayMs;
  storage.setItem(HALLOWEEN_2026.fallbackAtKey, String(deadline));
  return deadline;
}

// Run inside the origin-wide browser lock when available to avoid two tabs
// claiming the automatic reveal together. Manual reopening remains allowed.
export function claimHalloweenReveal(storage: VisitorStorage, manual = false) {
  if (!manual && storage.getItem(HALLOWEEN_2026.dismissalKey) === "1") return false;
  storage.setItem(HALLOWEEN_2026.dismissalKey, "1");
  return true;
}

export function isSpiderBodyHit(x: number, y: number, body: { left: number; top: number; width: number; height: number }) {
  const rx = Math.max(12, body.width / 2 + 4), ry = Math.max(12, body.height / 2 + 4);
  return ((x - body.left - body.width / 2) / rx) ** 2 + ((y - body.top - body.height / 2) / ry) ** 2 <= 1;
}
