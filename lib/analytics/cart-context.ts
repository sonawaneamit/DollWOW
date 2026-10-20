import { analyticsConfig, analyticsHostAllowed } from "@/lib/analytics/config";

export const CHECKOUT_ANALYTICS_ATTRIBUTE = "_dollwow_analytics_context";

export function checkoutAnalyticsAttribute(request: Request, env: Record<string, string | undefined> = process.env) {
  const raw = request.headers.get("cookie")?.split(/;\s*/).find(x => x.startsWith("dollwow_ga_context="))?.slice("dollwow_ga_context=".length);
  if (!raw || raw.length > 1000) return null;
  try {
    const context = JSON.parse(decodeURIComponent(raw));
    const config = analyticsConfig(env);
    const allowedId = context.mode === "test" ? config?.mode === "test" ? config.measurementId : config?.qaMeasurementId : config?.mode === "production" ? config.measurementId : null;
    const age = Date.now() - context.at;
    if (!analyticsHostAllowed(config, new URL(request.url).hostname) || !allowedId || context.measurementId !== allowedId || !Number.isFinite(age) || age < 0 || age > 1800000 || !/^\d+\.\d+$/.test(context.clientId) || !/^\d+$/.test(context.sessionId)) return null;
    return { key: CHECKOUT_ANALYTICS_ATTRIBUTE, value: JSON.stringify({ clientId: context.clientId, sessionId: context.sessionId, mode: context.mode, measurementId: allowedId, at: context.at }) };
  } catch { return null; }
}

export async function attachCheckoutAnalytics(cart: { id: string }, request: Request) {
  const attribute = checkoutAnalyticsAttribute(request);
  if (!attribute) return;
  try {
    const { updateCartAnalyticsAttribute } = await import("@/lib/shopify/storefront");
    await updateCartAnalyticsAttribute(cart.id, attribute);
  } catch {
    console.warn("[analytics] checkout context unavailable; checkout remains usable");
  }
}
