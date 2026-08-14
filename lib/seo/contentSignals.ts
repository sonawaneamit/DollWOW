export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no, use=reference";

export function isPublicAgentResourcePath(pathname: string) {
  return (
    pathname === "/llms.txt" ||
    pathname === "/agent-index.json" ||
    pathname === "/product-feed.json" ||
    pathname === "/llms" ||
    pathname.startsWith("/llms/") ||
    pathname === "/markdown" ||
    pathname.startsWith("/markdown/") ||
    pathname.startsWith("/datasets/")
  );
}
