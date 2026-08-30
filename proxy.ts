import { NextResponse, type NextRequest } from "next/server";
import { identifyAgentCrawler, requestedRepresentation } from "@/lib/seo/agentCrawler";
import { CONTENT_SIGNAL, isPublicAgentResourcePath } from "@/lib/seo/contentSignals";
import { isPublicMarkdownPath, markdownPathFor } from "@/lib/seo/publicMarkdownPath";
import { env, hasAdminBasicAuthEnv } from "@/lib/utils/env";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/cart/c") || request.nextUrl.pathname.startsWith("/checkouts")) {
    const checkoutDomain = (env.SHOPIFY_CHECKOUT_DOMAIN || "checkout.dollwow.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
    const checkoutUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, `https://${checkoutDomain}`);
    return NextResponse.redirect(checkoutUrl, 307);
  }

  if (request.nextUrl.pathname.startsWith("/dollvue/")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/ops")) {
    if (!hasAdminBasicAuthEnv()) {
      return new NextResponse("Admin auth is not configured.", { status: 503 });
    }

    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Basic ")) return unauthorized();

    const decoded = atob(auth.slice(6));
    const [username, password] = decoded.split(":");
    if (username !== env.ADMIN_BASIC_AUTH_USERNAME || password !== env.ADMIN_BASIC_AUTH_PASSWORD) return unauthorized();

    return NextResponse.next();
  }

  const accept = request.headers.get("accept");
  const publicPage = isPublicMarkdownPath(request.nextUrl.pathname);
  const publicAgentResource = publicPage || isPublicAgentResourcePath(request.nextUrl.pathname);
  const crawler = identifyAgentCrawler(request.headers.get("user-agent"));

  if (crawler && publicPage) {
    console.info(JSON.stringify({
      event: "public_agent_request",
      crawler,
      method: request.method,
      path: request.nextUrl.pathname,
      representation: requestedRepresentation(accept),
      timestamp: new Date().toISOString()
    }));
  }

  if (
    publicPage &&
    request.method === "GET" &&
    accept?.toLowerCase().includes("text/markdown") &&
    request.headers.get("x-dollwow-markdown-source") !== "1"
  ) {
    const markdownUrl = request.nextUrl.clone();
    markdownUrl.pathname = markdownPathFor(request.nextUrl.pathname);
    markdownUrl.search = "";
    const response = NextResponse.rewrite(markdownUrl);
    setAgentAccessHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  if (publicPage) {
    response.headers.set(
      "Link",
      `<${markdownPathFor(request.nextUrl.pathname)}>; rel=\"alternate\"; type=\"text/markdown\", </llms.txt>; rel=\"describedby\"; type=\"text/plain\"`
    );
    response.headers.set("Vary", "Accept");
  }
  if (publicAgentResource) setAgentAccessHeaders(response);
  return response;
}

function setAgentAccessHeaders(response: NextResponse) {
  response.headers.set("Content-Signal", CONTENT_SIGNAL);
}

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="DollWow Admin"'
    }
  });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/ops/:path*",
    "/cart/c/:path*",
    "/checkouts/:path*",
    "/",
    "/adult-only",
    "/authorized-vendors",
    "/best-price-guarantee",
    "/brands",
    "/brands/:path*",
    "/buyer-protection",
    "/care-for-life",
    "/compare",
    "/customize",
    "/dollvue",
    "/faq",
    "/factory-photos",
    "/help-me-choose",
    "/how-ordering-works",
    "/learn",
    "/learn/:path*",
    "/price-match",
    "/promo",
    "/privacy-policy",
    "/products/:path*",
    "/returns",
    "/scam-alert",
    "/shipping",
    "/shipping-protection",
    "/shop",
    "/shop/:path*",
    "/supplier",
    "/support",
    "/warehouse",
    "/why-dollwow",
    "/llms.txt",
    "/llms/:path*",
    "/markdown/:path*",
    "/agent-index.json",
    "/product-feed.json",
    "/datasets/:path*"
  ]
};
