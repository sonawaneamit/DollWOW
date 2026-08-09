"use client";

import type { MouseEvent } from "react";
import { Heart } from "lucide-react";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import {
  isInWishlist,
  readWishlist,
  toggleWishlistEntry,
  useWishlist,
  writeWishlist,
  type WishlistEntry
} from "@/lib/cart/wishlist";
import { useMounted } from "@/lib/utils/storageStore";

/**
 * Save-for-later heart. Safe inside card overlay links: it stops the click
 * from reaching the surrounding anchor. Fires add_to_wishlist on save only.
 */
export function WishlistButton({
  entry,
  label = false,
  className = ""
}: {
  entry: Omit<WishlistEntry, "savedAt">;
  label?: boolean;
  className?: string;
}) {
  const items = useWishlist();
  const mounted = useMounted();
  const saved = mounted && isInWishlist(items, entry.productHandle);

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleWishlistEntry(readWishlist(), entry);
    writeWishlist(result.items);
    if (result.saved) {
      trackEvent(analyticsEvents.addToWishlist, {
        item_id: entry.productHandle,
        item_name: entry.productTitle,
        item_brand: entry.brand,
        price: entry.unitPrice,
        currency: entry.currencyCode
      });
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${entry.productTitle} from saved dolls` : `Save ${entry.productTitle} for later`}
      className={`${label ? "inline-flex items-center gap-2" : ""} ${className}`.trim()}
    >
      <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      {label ? <span>{saved ? "Saved" : "Save for later"}</span> : null}
    </button>
  );
}
