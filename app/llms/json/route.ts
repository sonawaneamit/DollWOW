import { NextResponse } from "next/server";
import { searchAgentKnowledge } from "@/lib/seo/agentKnowledge";

export const revalidate = 60;

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim().slice(0, 200) ?? "";

  return NextResponse.json({
    query,
    results: searchAgentKnowledge(query)
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, must-revalidate",
      "X-Robots-Tag": "noindex, follow"
    }
  });
}
