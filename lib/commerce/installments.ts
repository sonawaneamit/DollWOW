/**
 * Monthly installment estimate shown near the PDP price. Disabled by default:
 * enable with NEXT_PUBLIC_SHOW_INSTALLMENTS=1 only after confirming Shop Pay
 * Installments, Klarna, or Affirm is actually active on the Shopify checkout,
 * otherwise the message would promise something checkout cannot offer.
 */
export const installmentConfig = {
  enabled: process.env.NEXT_PUBLIC_SHOW_INSTALLMENTS === "1",
  months: 12
} as const;

export function monthlyInstallment(amount: number, months: number = installmentConfig.months): number {
  if (!Number.isFinite(amount) || amount <= 0 || months <= 0) return 0;
  return Math.ceil(amount / months);
}

export function installmentLabel(amount: number, currencyCode: string, format: (amount: number, currency: string) => string): string | null {
  if (!installmentConfig.enabled) return null;
  const monthly = monthlyInstallment(amount);
  if (!monthly) return null;
  return `or from ${format(monthly, currencyCode)}/mo for ${installmentConfig.months} months with installment options at checkout`;
}
