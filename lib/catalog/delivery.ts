import type { Product } from "@/types/product";

const LEGACY_DELIVERY_DEFAULTS = new Set([
  "4-8 weeks",
  "usually 3-5 weeks from order to delivery",
  "fast shipping after stock confirmation",
  "ships within 1-3 business days after stock confirmation",
  "3-5 weeks from order to delivery"
]);

export function customerDeliveryEstimate(
  stockStatus: Product["extended"]["stockStatus"],
  supplierEstimate?: string,
  _material?: string
) {
  const estimate = supplierEstimate?.trim();
  if (estimate && !LEGACY_DELIVERY_DEFAULTS.has(estimate.toLowerCase().replaceAll("–", "-").replace(/\s+/g, " "))) {
    return estimate;
  }

  if (stockStatus === "ready_to_ship") {
    return "Est. 3 business days";
  }

  if (stockStatus === "custom") {
    return "Est. 3 weeks";
  }

  return undefined;
}

export type EstimatedDeliveryDate = {
  date: Date;
  formatted: string;
};

/**
 * Calculate Amazon-style estimated delivery date from today + delivery window.
 * RTS: today + 3 business days
 * Custom: today + 3 weeks (21 days)
 * Returns undefined if stockStatus is unknown.
 */
export function estimatedDeliveryDate(
  stockStatus: Product["extended"]["stockStatus"]
): EstimatedDeliveryDate | undefined {
  const today = new Date();
  
  if (stockStatus === "ready_to_ship") {
    // 3 business days
    const date = addBusinessDays(today, 3);
    return {
      date,
      formatted: formatDate(date)
    };
  }

  if (stockStatus === "custom") {
    // 3 weeks
    const date = addCalendarDays(today, 21);
    return {
      date,
      formatted: formatDate(date)
    };
  }

  return undefined;
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", { 
    weekday: "short", 
    month: "short", 
    day: "numeric" 
  });
  return formatter.format(date);
}
