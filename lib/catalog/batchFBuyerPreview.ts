export function batchFBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.DOL229_BATCH_F_BUYER_SUMMARY === "1" &&
    ["/brands/real-lady-dolls", "/shop/fair-skin-dolls", "/shop/height-160-164"].includes(path);
}
