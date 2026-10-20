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


type ServerEventPayload = {
  clientId?: string;
  userId?: string;
  params?: Record<string, unknown>;
  analyticsConsent?: boolean;
};

/**
 * Server-side event tracking via the GA4 Measurement Protocol. No-ops unless
 * production deployment, a consented browser identity, and explicit GA4
 * credentials are configured. Purchases are never emitted from this path.
 */
export async function trackServerEvent(event: string, payload: ServerEventPayload = {}) {
  // Purchases belong exclusively to the consent-aware Shopify checkout pixel.
  if (event === analyticsEvents.purchase || process.env.VERCEL_ENV !== "production" || !payload.analyticsConsent || !payload.clientId) return;

  const measurementId = process.env.GA_MEASUREMENT_ID?.trim();
  const apiSecret = process.env.GA_MP_API_SECRET;
  if (!measurementId || !apiSecret) return;

  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: payload.clientId,
        user_id: payload.userId,
        events: [{ name: event, params: payload.params ?? {} }]
      })
    });
  } catch (error) {
    console.warn("[analytics] failed to send server event", event, error);
  }
}
