export function batchDBuyerPreviewEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" && process.env.DOL229_BATCH_D_BUYER_SUMMARY === "1" &&
    ["/shop/ready-to-ship", "/shop/blonde-dolls", "/shop/tan-skin-dolls", "/brands/il-doll"].includes(path);
}
