export function batchGBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.DOL229_BATCH_G_BUYER_SUMMARY === "1" &&
    ["/brands/ai-tech-dolls", "/brands/avant-dolls", "/brands/funwest-dolls", "/brands/6ye-dolls"].includes(path);
}
