export function batchIBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.DOL229_BATCH_I_BUYER_SUMMARY === "1" &&
    ["/brands/piper-dolls", "/brands/rosretty-dolls", "/brands/sy-dolls", "/brands/yl-dolls"].includes(path);
}
