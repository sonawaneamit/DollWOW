import { getSitemapSegments, renderSitemap, sitemapResponse } from "@/lib/seo/sitemapSegments";

export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^(pages|collections|brands|learn|products-[a-z0-9-]+)\.xml$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  const segments = await getSitemapSegments();
  const entries = Object.hasOwn(segments, file) ? segments[file] : undefined;
  if (!entries?.length) return new Response("Not found", { status: 404 });
  return sitemapResponse(renderSitemap(entries));
}
