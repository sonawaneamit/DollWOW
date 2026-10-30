export function batchKBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.DOL229_BATCH_K_BUYER_SUMMARY === "1" &&
    ["/shop/height-170-plus", "/shop/latina-dolls", "/shop/sex-dolls"].includes(path);
}
