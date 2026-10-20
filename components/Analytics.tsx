"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useConsent, updateGtagConsent } from "@/lib/analytics/consent";
import { trackPageView } from "@/lib/analytics/client";
import { captureCheckoutAnalytics } from "@/lib/analytics/checkout-context";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function PageViewTracker({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsent();
  const lastPage = useRef("");

  useEffect(() => {
    if (!measurementId || !window.dollwowAnalytics || consent !== "granted") { lastPage.current = ""; return; }
    updateGtagConsent(consent);
    if (!document.getElementById("dollwow-ga-loader")) {
      const script = document.createElement("script");
      script.id = "dollwow-ga-loader";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${window.dollwowAnalytics.measurementId}`;
      script.onload = () => { void captureCheckoutAnalytics(); };
      document.head.appendChild(script);
    }
    if (lastPage.current !== pathname) {
      lastPage.current = pathname;
      trackPageView(pathname);
      void captureCheckoutAnalytics();
    }
  }, [measurementId, pathname, searchParams, consent]);

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
