export function batchJBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.DOL229_BATCH_J_BUYER_SUMMARY === "1" &&
    ["/shop/black-hair-dolls", "/shop/brown-skin-dolls", "/shop/fuller-dolls", "/shop/height-155-159", "/shop/height-165-169"].includes(path);
}
