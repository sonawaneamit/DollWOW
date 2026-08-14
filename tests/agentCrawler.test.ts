import { describe, expect, it } from "vitest";
import { identifyAgentCrawler, requestedRepresentation } from "@/lib/seo/agentCrawler";

describe("agent crawler observability", () => {
  it.each([
    ["Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)", "openai-gptbot"],
    ["OAI-SearchBot/1.0", "openai-search"],
    ["ClaudeBot/1.0", "anthropic-claude"],
    ["PerplexityBot/1.0", "perplexity"],
    ["Google-Extended", "google-extended"]
  ])("classifies %s", (userAgent, expected) => {
    expect(identifyAgentCrawler(userAgent)).toBe(expected);
  });

  it("does not label an ordinary browser as an agent crawler", () => {
    expect(identifyAgentCrawler("Mozilla/5.0 AppleWebKit/537.36 Chrome/140 Safari/537.36")).toBeNull();
  });

  it("recognizes explicit Markdown negotiation", () => {
    expect(requestedRepresentation("text/markdown, text/plain;q=0.9")).toBe("markdown");
    expect(requestedRepresentation("text/html,*/*")).toBe("html-or-default");
  });
});
