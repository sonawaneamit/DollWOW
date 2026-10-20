export type PurchasePixelConfig = { testId: string; productionId: string; productionEnabled?: boolean; diagnostics?: boolean };
export function installShopifyPurchasePixel(api: unknown, config: PurchasePixelConfig, runtime?: unknown): void;
export function buildShopifyPurchasePixel(config: PurchasePixelConfig): string;
