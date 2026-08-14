const baseUrl = (process.env.SITE_URL || "https://dollwow.com").replace(/\/$/, "");

const checks = [
  { path: "/", terms: ["DollWow"] },
  { path: "/shop/sex-dolls", terms: ["sex dolls"] },
  { path: "/brands/irontech-dolls", terms: ["Irontech"] },
  { path: "/learn/sex-doll-guide", terms: ["guide"] },
  { path: "/care-for-life", terms: ["Care"] }
];

const results = [];

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "DollWow-Agent-Readability-Audit/1.0",
        "Accept": "text/html"
      },
      redirect: "follow"
    });
    const html = await response.text();
    const visibleSource = decodeEntities(
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
    );
    const missingTerms = check.terms.filter((term) => !visibleSource.toLowerCase().includes(term.toLowerCase()));
    results.push({
      url,
      status: response.status,
      finalUrl: response.url,
      sourceTextCharacters: visibleSource.trim().length,
      missingTerms,
      passed: response.ok && visibleSource.trim().length > 500 && missingTerms.length === 0
    });
  } catch (error) {
    results.push({ url, passed: false, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, results }, null, 2));

if (results.some((result) => !result.passed)) process.exitCode = 1;

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}
