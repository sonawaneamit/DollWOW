import fs from "node:fs/promises";
import path from "node:path";

// Read-only snapshot in, public title strings out. Never copy source provenance.
const snapshotPath = process.argv[2];
if (!snapshotPath) throw new Error("Pass a reviewed catalog snapshot path");
const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
const counts = new Map();
for (const row of snapshot.baseline) counts.set(row.title, (counts.get(row.title) || 0) + 1);
const titles = [...counts].filter(([, count]) => count > 1).map(([title]) => title).sort();
const target = path.resolve("lib/catalog/duplicate-seo-titles.json");
await fs.writeFile(target, `${JSON.stringify(titles, null, 2)}\n`);
console.log(JSON.stringify({ repeatedTitleValues: titles.length, target }));
