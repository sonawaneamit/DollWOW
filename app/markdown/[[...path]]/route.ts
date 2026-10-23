import { canonicalPathFromMarkdownSegments, isPublicMarkdownPath } from "@/lib/seo/publicMarkdownPath";
import { publicMainHtmlToMarkdown } from "@/lib/seo/htmlToMarkdown";
import { getLearningArticle } from "@/lib/learn/content";
import { NextRequest } from "next/server";

export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const canonicalPath = canonicalPathFromMarkdownSegments(path);
  const isLearningPath = canonicalPath === "/learn" || canonicalPath.startsWith("/learn/");
  const needsFreshContent = isLearningPath || canonicalPath === "/tools/doll-size-weight-finder";
  if (canonicalPath.startsWith("/learn/") && !getLearningArticle(canonicalPath.slice("/learn/".length))) {
    return new Response("Public page not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" }
    });
  }

  if (!isPublicMarkdownPath(canonicalPath)) {
    return new Response("Public page not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const requestUrl = new URL(request.url);
  const canonicalUrl = new URL(canonicalPath, requestUrl.origin);
  const headers: Record<string, string> = {
    "Accept": "text/html",
    "User-Agent": "DollWow-Markdown-Renderer/1.0",
    "X-DollWow-Markdown-Source": "1"
  };
  // Preserve an already-authorized preview only on its exact deployment host.
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL &&
      canonicalUrl.origin === `https://${process.env.VERCEL_URL}`) {
    const previewCookie = new NextRequest(request).cookies.get("_vercel_jwt");
    if (previewCookie) headers.Cookie = `${previewCookie.name}=${previewCookie.value}`;
  }
  const sourceOptions = {
    headers,
    redirect: "manual" as const,
    ...(needsFreshContent ? { cache: "no-store" as const } : { next: { revalidate: 3600 } })
  };
  let resolvedUrl = canonicalUrl;
  let pageResponse = await fetch(resolvedUrl, sourceOptions);
  for (let remaining = 3; pageResponse.status >= 300 && pageResponse.status < 400 && remaining > 0; remaining--) {
    const location = pageResponse.headers.get("location");
    if (!location) break;
    const nextUrl = new URL(location, resolvedUrl);
    if (nextUrl.origin !== canonicalUrl.origin || !isPublicMarkdownPath(nextUrl.pathname)) break;
    resolvedUrl = nextUrl;
    pageResponse = await fetch(resolvedUrl, sourceOptions);
  }

  if (!pageResponse.ok) {
    return new Response("Canonical page could not be retrieved.", {
      status: pageResponse.status === 404 ? 404 : 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", ...(needsFreshContent ? { "Cache-Control": "private, no-store" } : {}) }
    });
  }

  const resolvedCanonicalUrl = resolvedUrl.toString();
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
      "Cache-Control": needsFreshContent ? "private, no-store" : "public, s-maxage=3600, stale-while-revalidate=86400",
      "Link": `<${resolvedCanonicalUrl}>; rel=\"canonical\", <${resolvedCanonicalUrl}>; rel=\"alternate\"; type=\"text/html\"`,
      "Vary": "Accept",
      "X-Robots-Tag": "noindex, follow"
    }
  });
}
