#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const ZIP_PATH = process.argv[2] || "/Users/amitsonawane/Desktop/Factory Photos.zip";
const TARGET = Number(process.argv[3] || 300);
const OUTPUT_DIR = join(ROOT, "public/images/factory-approval-archive");
const MANIFEST_PATH = join(ROOT, "app/factory-photos/archive-manifest.json");
const PROVENANCE_PATH = join(ROOT, "data/imports/factory-approval-preview-provenance.json");

const imageExtension = /\.(?:jpe?g|png|webp)$/i;
const blockedPath =
  /(^|[\/ _-])(?:sdg|order|invoice|tracking|customer|email|phone)(?:[\/ _-]|\d|$)|__macosx/i;
const blockedOcr =
  /\b(?:sdg|order|invoice|tracking|customer|e-?mail|phone|wechat|whatsapp)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s().#-]*){8,}/i;
const blockedArchivePaths = new Set([
  "Almira/IMG_1855.JPG",
  "Nessa/IMG_1662.JPG",
]);
const blockedArchiveFolders = new Set(["Almira", "Nessa"]);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding ?? null,
    maxBuffer: options.maxBuffer ?? 128 * 1024 * 1024,
    input: options.input,
    stdio: options.stdio,
  });
  if (result.status !== 0) {
    const detail = result.stderr ? String(result.stderr).slice(0, 500) : "";
    throw new Error(`${command} failed (${result.status}): ${detail}`);
  }
  return result.stdout;
}

function listCandidates() {
  const raw = run("unzip", ["-Z1", ZIP_PATH]);
  const paths = raw.toString("utf8").split(/\r?\n/).filter(Boolean);
  return paths.filter(
    (path) =>
      imageExtension.test(path) &&
      !blockedPath.test(path) &&
      !blockedArchivePaths.has(path) &&
      !blockedArchiveFolders.has(path.split("/")[0] || "") &&
      /^[\x20-\x7e]+$/.test(path),
  );
}

function balancedOrder(paths) {
  const folders = new Map();
  for (const path of paths) {
    const folder = path.split("/")[0] || "root";
    const group = folders.get(folder) || [];
    group.push(path);
    folders.set(folder, group);
  }

  const groups = [...folders.values()];
  for (const group of groups) {
    group.sort((left, right) => {
      const leftName = basename(left);
      const rightName = basename(right);
      return leftName.localeCompare(rightName, undefined, { numeric: true });
    });
  }

  const ordered = [];
  let round = 0;
  while (ordered.length < paths.length) {
    let added = false;
    for (const group of groups) {
      if (group[round]) {
        ordered.push(group[round]);
        added = true;
      }
    }
    if (!added) break;
    round += 1;
  }
  return ordered;
}

function watermarkSvg(width, height) {
  const size = Math.max(22, Math.round(width / 28));
  const row = Math.max(130, Math.round(size * 4.8));
  const lines = [];
  for (let y = -height; y < height * 2; y += row) {
    lines.push(
      `<text x="${-width * 0.35}" y="${y}" fill="#fff8f2" fill-opacity="0.14" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" letter-spacing="${Math.max(2, Math.round(size / 7))}">DOLLWOW.COM  •  FACTORY APPROVAL ARCHIVE  •  DOLLWOW.COM</text>`,
    );
  }
  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-22 ${width / 2} ${height / 2})">${lines.join("")}</g></svg>`,
  );
}

function deriveCategory(path, index) {
  const value = path.toLowerCase();
  if (/head|face|makeup|eye|wig|hair/.test(value)) return "face";
  if (/hand|foot|feet|nail|toe|finger/.test(value)) return "extremities";
  if (/skin|surface|mark|damage|joint/.test(value)) return "surface";
  if (/option|select|tone|color/.test(value)) return "selections";
  if (/final|ready|approve|qc|check/.test(value)) return "release";
  return index % 4 === 0 ? "release" : "build";
}

async function screenAndWrite(path, number) {
  const source = run("unzip", ["-p", ZIP_PATH, path], { maxBuffer: 256 * 1024 * 1024 });
  const sourceImage = sharp(source, { failOn: "warning" }).rotate();
  const metadata = await sourceImage.metadata();
  if (!metadata.width || !metadata.height || metadata.width < 500 || metadata.height < 500) {
    return { accepted: false, reason: "small" };
  }

  const ocrImage = await sourceImage
    .clone()
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .grayscale()
    .normalize()
    .jpeg({ quality: 72 })
    .toBuffer();
  const ocrText = run(
    "/opt/homebrew/bin/tesseract",
    ["stdin", "stdout", "--psm", "11"],
    { input: ocrImage, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (blockedOcr.test(String(ocrText))) return { accepted: false, reason: "ocr" };

  const normalized = await sourceImage
    .clone()
    .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const fileName = `archive-${String(number).padStart(3, "0")}.webp`;
  await sharp(normalized.data)
    .composite([{ input: watermarkSvg(normalized.info.width, normalized.info.height), blend: "over" }])
    .webp({ quality: 78, effort: 4 })
    .toFile(join(OUTPUT_DIR, fileName));

  return {
    accepted: true,
    entry: {
      src: `/images/factory-approval-archive/${fileName}`,
      category: deriveCategory(path, number),
    },
  };
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });

  for (let index = 9; index < 1000; index += 1) {
    rmSync(join(OUTPUT_DIR, `archive-${String(index).padStart(3, "0")}.webp`), { force: true });
  }

  const curated = [
    ["archive-03.webp", "build"],
    ["archive-01.webp", "face"],
    ["archive-04.webp", "selections"],
    ["archive-02.webp", "surface"],
    ["archive-07.webp", "extremities"],
    ["archive-08.webp", "release"],
    ["archive-06.webp", "build"],
    ["archive-05.webp", "selections"],
  ].map(([fileName, category]) => ({
    src: `/images/factory-approval-archive/${fileName}`,
    category,
  }));

  const candidates = balancedOrder(listCandidates());
  const entries = [...curated];
  const provenance = curated.map((entry) => ({ src: entry.src, sourceArchivePath: "curated-preview-asset" }));
  const rejected = { small: 0, ocr: 0, decode: 0 };

  for (const path of candidates) {
    if (entries.length >= TARGET) break;
    try {
      const result = await screenAndWrite(path, entries.length + 1);
      if (result.accepted) {
        entries.push(result.entry);
        provenance.push({ src: result.entry.src, sourceArchivePath: path });
      }
      else rejected[result.reason] += 1;
    } catch {
      rejected.decode += 1;
    }

    if ((entries.length - curated.length) % 20 === 0) {
      process.stdout.write(`\rAccepted ${entries.length}/${TARGET}`);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    localPreviewOnly: true,
    sourceAssetCount: 4398,
    entries,
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  mkdirSync(dirname(PROVENANCE_PATH), { recursive: true });
  writeFileSync(PROVENANCE_PATH, `${JSON.stringify({ generatedAt: manifest.generatedAt, entries: provenance }, null, 2)}\n`);
  process.stdout.write(`\nWrote ${entries.length} screened preview derivatives. Rejected: ${JSON.stringify(rejected)}\n`);
  if (entries.length < TARGET) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
