import { priceSizeIndexPayload } from "@/lib/references/priceSizeIndex";

export const dynamic = "force-dynamic";

export function GET() {
  const payload = priceSizeIndexPayload();
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!payload) return new Response(null, { status: 404, headers });
  return Response.json(payload, { headers });
}
