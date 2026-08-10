"use client";

import { useEffect } from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { writeRecentlyViewed } from "@/lib/cart/recentlyViewed";
import type { Product } from "@/types/product";
import { productPublicTitle } from "@/lib/catalog/naming";

/**
 * Client-side PDP tracking: fires GA4 view_item and records the visit in the
 * recently-viewed store (powers the "recently viewed" rails on cart/saved).
 */
export function PdpTrackers({ product }: { product: Product }) {
  useEffect(() => {
    const price = product.priceRange.minVariantPrice;
    const title = productPublicTitle(product);
    const brand = product.extended.brand ?? product.vendor;
    const image = product.featuredImage ?? product.images[0] ?? null;

    trackEvent(analyticsEvents.viewProduct, {
      currency: price.currencyCode,
      value: Number(price.amount),
      items: [{
        item_id: product.id,
        item_name: title,
        item_brand: brand,
        price: Number(price.amount),
        quantity: 1
      }]
    });

    writeRecentlyViewed({
      productHandle: product.handle,
      productTitle: title,
      brand,
      imageUrl: image?.url,
      imageAlt: image?.altText ?? title,
      unitPrice: Number(price.amount),
      currencyCode: price.currencyCode,
      readyToShip: product.extended.stockStatus === "ready_to_ship"
    });
  }, [product]);

  return null;
}
