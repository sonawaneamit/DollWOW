const crawlerPatterns = [
  ["openai-gptbot", /\bGPTBot\b/i],
  ["openai-search", /\bOAI-SearchBot\b/i],
  ["chatgpt-user", /\bChatGPT-User\b/i],
  ["anthropic-claude", /\bClaudeBot\b|\bClaude-SearchBot\b|\bClaude-User\b/i],
  ["perplexity", /\bPerplexityBot\b|\bPerplexity-User\b/i],
  ["google-extended", /\bGoogle-Extended\b/i],
  ["googlebot", /\bGooglebot\b/i],
  ["bingbot", /\bbingbot\b/i],
  ["apple-extended", /\bApplebot-Extended\b/i],
  ["applebot", /\bApplebot\b/i],
  ["amazonbot", /\bAmazonbot\b/i],
  ["meta-externalagent", /\bmeta-externalagent\b|\bFacebookBot\b/i],
  ["bytespider", /\bBytespider\b/i],
  ["cohere", /\bcohere-ai\b/i]
] as const;

export function identifyAgentCrawler(userAgent: string | null) {
  if (!userAgent) return null;
  return crawlerPatterns.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? null;
}

export function requestedRepresentation(accept: string | null) {
  if (accept?.toLowerCase().includes("text/markdown")) return "markdown";
  if (accept?.toLowerCase().includes("application/json")) return "json";
  return "html-or-default";
}
