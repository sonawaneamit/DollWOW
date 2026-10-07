import { getSitemapSegments, renderSitemapIndex, sitemapResponse } from "@/lib/seo/sitemapSegments";

export const revalidate = 3600;

export async function GET() {
  return sitemapResponse(renderSitemapIndex(await getSitemapSegments()));
}
