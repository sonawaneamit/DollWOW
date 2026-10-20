/** Install in Shopify Customer events with Analytics required, Marketing off, data sale off. */
export function installShopifyPurchasePixel(api, config, runtime = window) {
  const { analytics } = api;
  const log = reason => { if (config.diagnostics) runtime.console?.info("DollWOW purchase QA: " + reason); };
  log("subscribed");
  let privacy = api.init.customerPrivacy;
  const active = new Set();
  api.customerPrivacy.subscribe("visitorConsentCollected", event => { privacy = event.customerPrivacy; });
  analytics.subscribe("checkout_completed", async event => {
    log("checkout_completed received");
    if (!privacy?.analyticsProcessingAllowed) return log("analytics permission absent");
    const hostname = event.context?.document?.location?.hostname;
    if (!["checkout.dollwow.com", "dollwow.com", "www.dollwow.com", "shopify.com"].includes(hostname)) return;
    const checkout = event.data?.checkout;
    const orderId = checkout?.order?.id;
    if (!orderId || !/^(gid:\/\/shopify\/Order\/)?\d+$/.test(String(orderId))) return;
    let context;
    try {
      const attribute = checkout.attributes?.find(x => x.key === "_dollwow_analytics_context");
      context = attribute ? JSON.parse(attribute.value) : JSON.parse(decodeURIComponent(await api.browser.cookie.get("dollwow_ga_context")));
    } catch { return log("checkout identity absent or invalid"); }
    if (!context || typeof context !== "object") return log("checkout identity absent");
    const age = Date.now() - context.at;
    if (!Number.isFinite(age) || age < 0 || age > 1800000 || !/^\d+\.\d+$/.test(context.clientId) || !/^\d+$/.test(context.sessionId)) return;
    const mode = context.mode;
    const measurementId = mode === "test" ? config.testId : config.productionEnabled ? config.productionId : null;
    if (!measurementId || context.measurementId !== measurementId || (mode !== "production" && mode !== "test")) return log("stream isolation rejected event");
    const lines = checkout.lineItems || [];
    const amount = checkout.subtotalPrice?.amount;
    const value = Number(amount);
    if (amount == null || !Number.isFinite(value) || value < 0 || !/^[A-Z]{3}$/.test(checkout.currencyCode) || !lines.length) return log("checkout value or currency absent");
    const items = lines.map(line => {
      const quantity = Number(line.quantity);
      const final = line.finalLinePrice?.amount;
      const price = Number(final) / quantity;
      return { item_id: String(line.variant?.id || line.id || ""), price, quantity };
    });
    if (items.some(item => !item.item_id || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity < 1)) return log("checkout line incomplete");
    const key = `dollwow_purchase_v1:${measurementId}:${orderId}`;
    if (active.has(key)) return;
    active.add(key);
    try {
      if (await api.browser.localStorage.getItem(key)) return;
      if (!privacy?.analyticsProcessingAllowed) return;
      runtime.dataLayer = runtime.dataLayer || [];
      runtime.gtag = runtime.gtag || function () { runtime.dataLayer.push(arguments); };
      const gtag = runtime.gtag;
      gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      gtag("js", new Date());
      gtag("config", measurementId, { send_page_view: false, client_id: context.clientId, allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = runtime.document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      runtime.document.head.appendChild(script);
      gtag("event", "purchase", {
        send_to: measurementId,
        transaction_id: String(orderId).split("/").pop(),
        currency: checkout.currencyCode,
        value,
        shipping: Number(checkout.shippingLine?.price?.amount || 0),
        tax: Number(checkout.totalTax?.amount || 0),
        items,
        session_id: Number(context.sessionId),
        page_location: "https://checkout.dollwow.com/checkout",
        page_referrer: "https://dollwow.com/",
        ...(mode === "test" ? { debug_mode: true, traffic_type: "dollwow_qa" } : {}),
        event_callback: async () => {
          await api.browser.localStorage.setItem(key, "sent");
        }
      });
      log("purchase queued to isolated stream");
    } catch {
      active.delete(key);
      // Tracking must not affect checkout. GA transaction_id additionally deduplicates retries.
    }
  });
}

export function buildShopifyPurchasePixel(config) {
  if (!/^G-[A-Z0-9]+$/.test(config.testId) || !/^G-[A-Z0-9]+$/.test(config.productionId) || config.testId === config.productionId) throw new Error("Distinct verified production and QA IDs required");
  return `(${installShopifyPurchasePixel.toString()})({analytics,init,browser,customerPrivacy:api.customerPrivacy}, ${JSON.stringify(config)});`;
}
