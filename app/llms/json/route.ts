import { NextResponse } from "next/server";
import { searchAgentKnowledge } from "@/lib/seo/agentKnowledge";

export const revalidate = 3600;

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim().slice(0, 200) ?? "";

  return NextResponse.json({
    query,
    results: searchAgentKnowledge(query)
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, follow"
    }
  });
}
