import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "lib/catalog"];
const learningContentRoots = ["content/learn/drafts"];
const excludedSegments = ["/api/", "/ops/", "/admin/", "/llms.txt/", ".test.", ".spec."];
const rules = [
  ["backend order notes", /\border notes\b/gi],
  ["checkout implementation wording", /passed to Shopify/gi],
  ["stock path", /stock path/gi],
  ["order path", /order path/gi],
  ["factory-order path", /factory-order path/gi],
  ["team review fallback", /team review fallback/gi],
  ["fallback review", /fallback review/gi],
  ["grounded in the real listing", /grounded in the real listing/gi],
  ["styled for discovery", /styled for discovery/gi],
  ["styled previews", /styled previews/gi],
  ["intentionally DollWow-written", /intentionally DollWow-written/gi],
  ["supplier-provided configuration data", /supplier-provided configuration data/gi],
  ["captured from supplier", /captured from supplier/gi],
  ["ask a human", /ask a human/gi],
  ["need a human", /need a human/gi],
  ["implementation-facing product copy", /the page (?:shows|starts from) the (?:default|factory|exact)/gi],
  ["storefront self-description", /a premium storefront for/gi],
  ["internal publishing language", /editorial review notes|before publication|agent extraction|knowledge files/gi],
  ["internal search-planning language", /\bsearch volume\b|\bsearch intent\b|\bSERPs?\b/gi],
  ["internal catalog framing", /\bcatalog data\b|\blive catalog\b|\b(?:comparison|support) angle\b|\bDollWow should\b/gi],
  ["internal content labels", /source trail|claim rules|key facts for AI assistants/gi],
  ["unnecessary buyer deflection", /another seller may be (?:a better fit|the better choice)/gi],
  ["platform placeholder", /product image appears when Shopify media is connected/gi],
  ["raw validation error", /too_small|invalid_type|expected string to have/gi]
];
const learningContentRules = [
  ["internal SEO or ecommerce abbreviation", /\b(?:SEO|GEO|SERPs?|PDPs?|LLMs?)\b/g],
  ["search-planning language", /\b(?:search volume|search intent|keyword clusters?)\b/gi],
  ["publishing instruction", /editorial review notes|before publication|scheduled review|agent extraction|knowledge files/gi],
  ["technical source-of-truth language", /\bcanonical\b|\bcatalog data\b|\blive catalog\b/gi],
  ["internal content framing", /\b(?:comparison|support) angle\b|\bDollWow should\b/gi]
];
const timingRoots = ["app", "components", "lib", "scripts"];
const timingExclusions = new Set([
  "lib/catalog/delivery.ts",
  "scripts/clean-shopify-delivery-estimates.mjs"
]);
const timingRules = [
  ["unsupported business-day range", /\b\d+\s*[-–]\s*\d+\s+business days?\b/gi],
  ["unsupported week range", /\b\d+\s*[-–]\s*\d+\s+weeks?\b/gi]
];

async function collectFiles(relativeDir, extensionPattern = /\.(tsx?|jsx?)$/) {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    const normalized = `/${relativePath.replaceAll("\\", "/")}`;
    if (excludedSegments.some((segment) => normalized.includes(segment))) continue;
    if (entry.isDirectory()) files.push(...(await collectFiles(relativePath, extensionPattern)));
    if (entry.isFile() && extensionPattern.test(entry.name)) files.push(relativePath);
  }

  return files;
}

const files = (await Promise.all(roots.map((root) => collectFiles(root)))).flat();
const learningContentFiles = (
  await Promise.all(learningContentRoots.map((root) => collectFiles(root, /\.md$/)))
).flat();
const timingFiles = (
  await Promise.all(timingRoots.map((root) => collectFiles(root, /\.(?:tsx?|jsx?|mjs)$/)))
).flat().filter((file) => !timingExclusions.has(file));
const findings = [];

for (const file of files) {
  const source = await readFile(path.join(process.cwd(), file), "utf8");
  const lines = source.split("\n");
  for (const [label, pattern] of rules) {
    pattern.lastIndex = 0;
    for (let index = 0; index < lines.length; index += 1) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[index])) findings.push(`${file}:${index + 1} [${label}] ${lines[index].trim()}`);
    }
  }
}

for (const file of learningContentFiles) {
  const source = await readFile(path.join(process.cwd(), file), "utf8");
  const lines = source.split("\n");
  for (const [label, pattern] of learningContentRules) {
    pattern.lastIndex = 0;
    for (let index = 0; index < lines.length; index += 1) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[index])) findings.push(`${file}:${index + 1} [${label}] ${lines[index].trim()}`);
    }
  }
}

for (const file of timingFiles) {
  const source = await readFile(path.join(process.cwd(), file), "utf8");
  const lines = source.split("\n");
  for (const [label, pattern] of timingRules) {
    pattern.lastIndex = 0;
    for (let index = 0; index < lines.length; index += 1) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[index])) findings.push(`${file}:${index + 1} [${label}] ${lines[index].trim()}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Customer-facing copy audit failed:\n");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log(
  `Customer-facing copy audit passed (${files.length} code files, ${learningContentFiles.length} learning articles, and ${timingFiles.length} timing sources checked).`
);
