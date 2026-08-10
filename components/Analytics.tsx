"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { readConsent, updateGtagConsent } from "@/lib/analytics/consent";
import { trackPageView } from "@/lib/analytics/client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function PageViewTracker({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId) return;
    const query = searchParams?.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [measurementId, pathname, searchParams]);

  return null;
}

/**
 * Loads GA4 with Consent Mode v2 defaults (denied until the visitor chooses),
 * plus Vercel Analytics and Speed Insights. The measurement ID is passed from
 * the server layout so no NEXT_PUBLIC env duplication is required.
 */
export function Analytics({ measurementId }: { measurementId?: string }) {
  return (
    <>
      {measurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('js', new Date());
              gtag('config', '${measurementId}', {
                send_page_view: false,
                anonymize_ip: true,
                linker: { domains: ['dollwow.com', 'checkout.dollwow.com'] }
              });
            `}
          </Script>
          <ConsentRestore />
          <Suspense fallback={null}>
            <PageViewTracker measurementId={measurementId} />
          </Suspense>
        </>
      ) : null}
      <VercelAnalytics />
      <SpeedInsights />
    </>
  );
}

function ConsentRestore() {
  useEffect(() => {
    const stored = readConsent();
    if (stored !== "unknown") updateGtagConsent(stored);
  }, []);
  return null;
}
