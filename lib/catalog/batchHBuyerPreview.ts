export function batchHBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.DOL229_BATCH_H_BUYER_SUMMARY === "1" &&
    ["/brands/hr-dolls", "/brands/jarliet-dolls", "/brands/lusandy-dolls"].includes(path);
}
