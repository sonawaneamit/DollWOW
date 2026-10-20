export const PRODUCTION_MEASUREMENT_ID = "G-4V999366W5";
export const PRODUCTION_ANALYTICS_HOSTS = ["dollwow.com", "www.dollwow.com"];

export type AnalyticsConfig = { measurementId: string; hosts: string[]; mode: "production" | "test"; qaMeasurementId?: string };

export function analyticsConfig(env: Record<string, string | undefined>): AnalyticsConfig | null {
  if (env.VERCEL_ENV === "production") {
    const measurementId = env.GA_MEASUREMENT_ID?.trim() || PRODUCTION_MEASUREMENT_ID;
    const qa = env.GA_TEST_MEASUREMENT_ID?.trim();
    return { measurementId, hosts: PRODUCTION_ANALYTICS_HOSTS, mode: "production", ...(qa && /^G-[A-Z0-9]+$/.test(qa) && qa !== measurementId ? { qaMeasurementId: qa } : {}) };
  }
  const id = env.GA_TEST_MEASUREMENT_ID?.trim();
  const hosts = (env.GA_TEST_ALLOWED_HOSTS || "").split(",").map(x => x.trim().toLowerCase()).filter(x => /^[a-z0-9.-]+$/.test(x));
  if (!id || id === PRODUCTION_MEASUREMENT_ID || id === env.GA_MEASUREMENT_ID?.trim() || !/^G-[A-Z0-9]+$/.test(id) || !hosts.length) return null;
  return { measurementId: id, hosts, mode: "test" };
}

export function analyticsHostAllowed(config: AnalyticsConfig | null, hostname: string) {
  return !!config?.hosts.includes(hostname.toLowerCase());
}

/** Never forward query strings, fragments, or checkout tokens as page addresses. */
export function analyticsPageLocation(input: string) {
  const url = new URL(input);
  const path = /^\/(checkouts|orders|account)(\/|$)/.test(url.pathname) ? "/checkout" : url.pathname;
  return url.origin + path;
}

export function analyticsBootstrap(config: AnalyticsConfig) {
  return `if (${JSON.stringify(config.hosts)}.includes(location.hostname.toLowerCase())) {
window.dollwowAnalytics = ${JSON.stringify(config)};
if(window.dollwowAnalytics.qaMeasurementId && /(?:^|;\u0020)dollwow_analytics_qa=1(?:;|$)/.test(document.cookie || '')) {
  window.dollwowAnalytics = Object.assign({},window.dollwowAnalytics,{measurementId:window.dollwowAnalytics.qaMeasurementId,mode:'test'});
}
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
window.gtag('js', new Date());
var campaign={};var query=new URLSearchParams(location.search);for(var key of ['source','medium','campaign','term','content']){var value=query.get('utm_'+key);if(value&&/^[a-zA-Z0-9 _.-]{1,100}$/.test(value))campaign['campaign_'+(key==='campaign'?'name':key)]=value;}
window.gtag('config', window.dollwowAnalytics.measurementId, Object.assign(campaign,{send_page_view:false, page_location:location.origin+location.pathname, page_referrer:document.referrer ? new URL(document.referrer).origin : '', cookie_domain:${JSON.stringify(config.mode === "production" ? "dollwow.com" : "auto")}, allow_google_signals:false, allow_ad_personalization_signals:false, linker:{domains:['dollwow.com','checkout.dollwow.com']}}));
}`;
}
