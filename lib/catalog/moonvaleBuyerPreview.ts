export function moonvaleBuyerPreviewEnabled(brand: string) {
  return brand === "moonvale" && process.env.VERCEL_ENV === "preview" && process.env.DOL229_MOONVALE_BUYER_SUMMARY === "1";
}
