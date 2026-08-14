import { agentKnowledgeAsText, searchAgentKnowledge } from "@/lib/seo/agentKnowledge";

export const revalidate = 3600;

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim().slice(0, 200) ?? "";
  const records = searchAgentKnowledge(query);

  return new Response(agentKnowledgeAsText(query, records), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow"
    }
  });
}
