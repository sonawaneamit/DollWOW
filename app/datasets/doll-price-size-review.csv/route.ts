import { priceSizeIndexCsvText } from "@/lib/references/priceSizeIndex";

export const dynamic = "force-dynamic";

export function GET() {
  const csv = priceSizeIndexCsvText();
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!csv) return new Response(null, { status: 404, headers });
  return new Response(csv, { headers: {
    ...headers, "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="dollwow-price-height-review-2026-10-23.csv"'
  } });
}
