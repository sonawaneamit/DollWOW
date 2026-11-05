export function minimumRetailForMargin(costCents: number, marginBasisPoints = 3000, discountCents = 0) {
  if (!Number.isSafeInteger(costCents) || costCents <= 0 || !Number.isSafeInteger(discountCents)
    || discountCents < 0 || !Number.isSafeInteger(marginBasisPoints) || marginBasisPoints < 0 || marginBasisPoints >= 10000) {
    throw new Error('Valid nonnegative money and a margin below 100% are required');
  }
  return Math.ceil(costCents * 10000 / (10000 - marginBasisPoints)) + discountCents;
}

export function fanrealPriceReviewEnabled(environment: {VERCEL_ENV?:string; DOL295_PRICE_PREVIEW?:string} = {
  VERCEL_ENV: process.env.VERCEL_ENV, DOL295_PRICE_PREVIEW: process.env.DOL295_PRICE_PREVIEW
}) {
  return environment.VERCEL_ENV === 'preview' && environment.DOL295_PRICE_PREVIEW === '1';
}
