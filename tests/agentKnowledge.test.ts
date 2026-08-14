import { describe, expect, it } from "vitest";
import { agentKnowledgeAsText, getAgentKnowledgeRecords, searchAgentKnowledge } from "@/lib/seo/agentKnowledge";

describe("agent-readable knowledge layer", () => {
  it("publishes canonical and Markdown URLs for production Learning Center guides", () => {
    const guides = getAgentKnowledgeRecords().filter((record) => record.type === "guide");

    expect(guides.length).toBeGreaterThanOrEqual(49);
    expect(guides.every((guide) => guide.url.startsWith("https://dollwow.com/learn/"))).toBe(true);
    expect(guides.every((guide) => guide.markdownUrl === guide.url.replace("https://dollwow.com", "https://dollwow.com/markdown"))).toBe(true);
  });

  it("returns relevant results for a natural buyer question", () => {
    const results = searchAgentKnowledge("How do TPE and silicone dolls compare?");
    const joined = results.map((result) => `${result.title} ${result.url}`).join(" ").toLowerCase();

    expect(joined).toContain("tpe");
    expect(joined).toContain("silicone");
  });

  it("keeps query output concise and tied to canonical sources", () => {
    const output = agentKnowledgeAsText("price protection", searchAgentKnowledge("price protection"));

    expect(output).toContain("Catalog and policy pages are the source of truth");
    expect(output).toContain("Canonical: https://dollwow.com/");
    expect(output).not.toContain("undefined");
  });
});
