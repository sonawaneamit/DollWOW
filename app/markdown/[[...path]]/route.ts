import { canonicalPathFromMarkdownSegments, isPublicMarkdownPath } from "@/lib/seo/publicMarkdownPath";
import { publicMainHtmlToMarkdown } from "@/lib/seo/htmlToMarkdown";

export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const canonicalPath = canonicalPathFromMarkdownSegments(path);

  if (!isPublicMarkdownPath(canonicalPath)) {
    return new Response("Public page not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const requestUrl = new URL(request.url);
  const canonicalUrl = new URL(canonicalPath, requestUrl.origin);
  const pageResponse = await fetch(canonicalUrl, {
    headers: {
      "Accept": "text/html",
      "User-Agent": "DollWow-Markdown-Renderer/1.0",
      "X-DollWow-Markdown-Source": "1"
    },
    redirect: "follow",
    next: { revalidate: 3600 }
  });

  if (!pageResponse.ok) {
    return new Response("Canonical page could not be retrieved.", {
      status: pageResponse.status === 404 ? 404 : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const resolvedCanonicalUrl = pageResponse.url || canonicalUrl.toString();
  const markdown = publicMainHtmlToMarkdown(await pageResponse.text(), resolvedCanonicalUrl);
  if (!markdown) {
    return new Response("Canonical page did not contain readable main content.", {
      status: 422,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Link": `<${resolvedCanonicalUrl}>; rel=\"canonical\", <${resolvedCanonicalUrl}>; rel=\"alternate\"; type=\"text/html\"`,
      "Vary": "Accept",
      "X-Robots-Tag": "noindex, follow"
    }
  });
}
