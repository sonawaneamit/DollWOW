export const analyticsEvents = {
  viewProduct: "view_item",
  viewCart: "view_cart",
  addToCart: "add_to_cart",
  addToBag: "add_to_cart",
  addUpsell: "add_upsell",
  addToWishlist: "add_to_wishlist",
  beginCheckout: "begin_checkout",
  purchase: "purchase",
  search: "search",
  startHelpMeChoose: "start_help_me_choose",
  completeHelpMeChoose: "complete_help_me_choose",
  submitCompareListing: "submit_compare_listing",
  viewComparisonResult: "view_comparison_result",
  askHumanHelp: "ask_human_help",
  downloadGuide: "download_guide"
} as const;

const DEFAULT_GA_MEASUREMENT_ID = "G-4V999366W5";

type ServerEventPayload = {
  clientId?: string;
  userId?: string;
  params?: Record<string, unknown>;
};

/**
 * Server-side event tracking via the GA4 Measurement Protocol. No-ops unless
 * both GA_MEASUREMENT_ID and GA_MP_API_SECRET are configured, so local
 * development stays quiet. Used for server-observed funnel events such as
 * begin_checkout and purchase (via the Shopify orders webhook).
 */
export async function trackServerEvent(event: string, payload: ServerEventPayload = {}) {
  if (process.env.NODE_ENV !== "production" && !process.env.GA_MP_API_SECRET) {
    console.info("[analytics]", event, payload);
    return;
  }

  const measurementId = process.env.GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_MEASUREMENT_ID;
  const apiSecret = process.env.GA_MP_API_SECRET;
  if (!measurementId || !apiSecret) return;

  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: payload.clientId ?? "dollwow.server",
        user_id: payload.userId,
        events: [{ name: event, params: payload.params ?? {} }]
      })
    });
  } catch (error) {
    console.warn("[analytics] failed to send server event", event, error);
  }
}
