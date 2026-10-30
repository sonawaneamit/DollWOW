export function batchEBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" && process.env.DOL229_BATCH_E_BUYER_SUMMARY === "1" &&
    ["/shop/hips", "/shop/redhead-dolls", "/shop/slim-dolls", "/brands/angelkiss-dolls"].includes(path);
}
