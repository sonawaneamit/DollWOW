import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "images", "learn");
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const FORCE = process.argv.includes("--force");

const sharedStyle = [
  "Premium editorial illustration for DollWow Learning Center.",
  "Use a refined magazine-style digital illustration, not a photorealistic render.",
  "Use elegant adult-commerce buyer-guide symbolism: material samples, measuring tools, discreet packaging, catalog cards, swatches, silhouettes, privacy objects, and soft product-display forms.",
  "No readable text, no logos, no fake reviews, no explicit sexual activity, no nudity focus, no underage-coded styling, no school themes.",
  "Warm dark boudoir palette with ivory, muted rose, bronze, black, soft grain, confident composition, and human art-director polish.",
  "Landscape composition with clean negative space, suitable for a featured blog image."
].join(" ");

const images = [
  {
    slug: "tpe-vs-silicone-sex-dolls",
    prompt:
      "Illustrated side-by-side material comparison: one soft matte sample, one smoother glossy sample, with a simple draped display form, care cloth, and small swatch labels shown as abstract blank cards. Calm education mood."
  },
  {
    slug: "sex-doll-cost",
    prompt:
      "Illustrated buyer desk scene with abstract price-tier cards, measuring tape, material swatches, shipping box icon, care kit shapes, and a turned-away product catalog card. Calm value-comparison mood."
  },
  {
    slug: "best-sex-dolls",
    prompt:
      "Illustrated curated showroom scene with several tasteful display-form silhouettes in soft focus, material cards, measurement tools, and comparison tokens in the foreground. Buyer-guide atmosphere."
  },
  {
    slug: "most-realistic-sex-dolls",
    prompt:
      "Illustrated realism detail board: glass eye shapes, wig fiber strands, skin texture samples, sculpt reference profile, lighting swatches, and a magnifying glass. Premium inspection mood."
  },
  {
    slug: "mini-sex-dolls",
    prompt:
      "Illustrated compact storage and fit guide: elegant apartment closet, smaller storage case, folded fabric, measuring tape, discreet box, and scale/footprint symbols. Practical premium mood."
  },
  {
    slug: "male-sex-doll-buying-guide",
    prompt:
      "Illustrated male product guide: tasteful masculine display-form silhouette, measuring tape, material swatches, neutral wardrobe pieces, and body-proportion guide shapes. Premium catalog education mood."
  },
  {
    slug: "sex-doll-reviews",
    prompt:
      "Illustrated buyer-protection review-check scene: laptop with abstract blank review cards, magnifying glass, product proof cards, shipping note shape, and verification check symbols. Trust and verification mood."
  },
  {
    slug: "ready-to-ship-vs-custom-sex-dolls",
    prompt:
      "Illustrated split logistics scene: one side has a discreet shipping box and warehouse shapes, the other has customization swatches, hair sample, eye-color cards, and a blank product proof card."
  },
  {
    slug: "discreet-sex-doll-shipping",
    prompt:
      "Illustrated discreet delivery scene: plain unmarked carton in a refined hallway, neutral packing materials, lock/privacy symbol, soft warm lighting, subtle premium buyer-support mood."
  }
];

await fs.mkdir(OUT_DIR, { recursive: true });

for (const image of images) {
  const outputPath = path.join(OUT_DIR, `${image.slug}.webp`);
  if (!FORCE) {
    try {
      await fs.access(outputPath);
      console.log(`skip existing ${path.relative(ROOT, outputPath)}`);
      continue;
    } catch {
      // Generate missing image.
    }
  }

  console.log(`generating ${image.slug}`);
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: `${sharedStyle} ${image.prompt}`,
      size: "1536x1024",
      n: 1,
      output_format: "webp",
      output_compression: 86
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${image.slug}: ${payload.error?.message || response.statusText}`);
  }

  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${image.slug}: missing b64_json in image response`);
  await fs.writeFile(outputPath, Buffer.from(b64, "base64"));
  console.log(`wrote ${path.relative(ROOT, outputPath)}`);
}
