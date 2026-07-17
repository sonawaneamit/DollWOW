import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = ["app", "components", "lib/catalog"];
const excludedSegments = ["/api/", "/ops/", "/admin/", "/llms.txt/", ".test.", ".spec."];
const rules = [
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
  ["raw validation error", /too_small|invalid_type|expected string to have/gi]
];

async function collectFiles(relativeDir) {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    const normalized = `/${relativePath.replaceAll("\\", "/")}`;
    if (excludedSegments.some((segment) => normalized.includes(segment))) continue;
    if (entry.isDirectory()) files.push(...(await collectFiles(relativePath)));
    if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) files.push(relativePath);
  }

  return files;
}

const files = (await Promise.all(roots.map(collectFiles))).flat();
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

if (findings.length > 0) {
  console.error("Customer-facing copy audit failed:\n");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log(`Customer-facing copy audit passed (${files.length} files checked).`);
