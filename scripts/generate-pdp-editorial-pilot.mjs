#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const VENICE_ENDPOINT = "https://api.venice.ai/api/v1/chat/completions";
const EXTRACTOR_MODEL = process.env.PDP_EDITORIAL_EXTRACTOR_MODEL || "qwen3-vl-235b-a22b";
const WRITER_MODEL = process.env.PDP_EDITORIAL_WRITER_MODEL || "gemma-4-uncensored";
const REVIEWER_MODEL = process.env.PDP_EDITORIAL_REVIEWER_MODEL || "qwen3-235b-a22b-instruct-2507";
const args = parseArgs(process.argv.slice(2));
const OUTPUT = args.output || "data/exports/pdp-phase/pdp-editorial-pilot-drafts.json";

const products = [
  {
    handle: "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd",
    facts: ["Irontech Evie", "clearly adult doll", "full silicone", "161 cm (5 ft 3 in)", "F-cup"],
  },
  {
    handle: "wm-y019-157cm-b-cup-silicone-companion-doll-txhmc",
    facts: ["WM Lila Dane", "clearly adult doll", "full silicone", "157 cm (5 ft 2 in)", "B-cup"],
  },
  {
    handle: "starpery-keisha-174cm-d-cup-silicone-companion-doll-1n6ah",
    facts: ["Starpery Keisha", "clearly adult doll", "full silicone", "174 cm (5 ft 9 in)", "D-cup"],
  },
  {
    handle: "sedoll-aryana-b-160cm-c-cup-silicone-companion-doll-9kt9z",
    facts: ["SE Doll Aryana B", "clearly adult doll", "full silicone", "160 cm (5 ft 3 in)", "C-cup"],
  },
  {
    handle: "piper-lana-155cm-f-cup-silicone-companion-doll-1d7qv",
    facts: ["Piper Lana", "clearly adult doll", "full silicone", "155 cm (5 ft 1 in)", "F-cup"],
  },
  {
    handle: "irontech-kevin-176cm-silicone-companion-doll-is1mv",
    facts: ["Irontech Kevin", "clearly adult male doll", "full silicone", "176 cm (5 ft 9 in)"],
  },
];

const extractorPrompt = `Analyze this supplier-authorized contact sheet for one clearly adult doll product. Return strict JSON only with:
- visibleStyling: hair, eyes, makeup, expression, clothing, props, pose, lighting, color palette, and setting that are visibly consistent
- dominantTheme: one concise, specific scenario or aesthetic label supported by at least two non-text visual cues. Name a recognizable sport or activity specifically rather than using a generic label like athletic or sporty
- themeEvidence: the concrete objects, clothing, and surroundings that support the dominant theme
- uncertainDetails: anything partly obscured, inconsistent, or unsafe to state confidently
- prohibitedInferences: personality, feelings, agency, function, movement, realism, included items, performance, or buyer outcomes that must not be inferred

Describe only visible evidence. Do not interpret a prop as an included accessory. Do not identify a real person. Resolve theme conflicts from the overall scene and prominent objects. Physical objects and recognizable uniform shapes outweigh printed words or logos. For example, a full-size baseball bat plus a visor, varsity jacket, striped socks, and athletic uniform supports a baseball theme even when a garment contains the word "racing." Printed text cannot establish or override the dominant theme by itself.`;

const writerPrompt = `You are the senior adult-commerce copywriter for DollWOW. Write premium, sensual, erotically persuasive American English for a clearly adult sex doll.

Requirements:
- Return strict JSON with eyebrow, heading, and paragraph only.
- Paragraph must be 90-130 words.
- Use the verified facts and visual brief as creative inspiration for an adult fantasy that could only have been written for this particular doll.
- Let the fantasy unfold naturally. The doll may have a voice, personality, agency, and initiative within the fictional scene.
- Do not present invented details as real specifications, capabilities, materials, included accessories, availability, or guarantees.
- The finished copy must not discuss photographs, galleries, studios, source material, analysis, prompts, SEO, or content production.
- Use US and metric measurements exactly as supplied if measurements appear.
- Keep it seductive and confident without sounding cheap, repetitive, or mechanically generated.
- Do not use an em dash or the construction "not just X, but Y."
- The eyebrow and heading should extend the fantasy, not label the section as an editorial description.`;

const reviewerPrompt = `Audit only the supplied draft against the verified facts and locked visible evidence. Return strict JSON with passed, violations, and notes.

Fail the draft if it:
- contradicts the verified identity, appearance, or dominant visual theme;
- states an invented specification, capability, material, accessory, availability claim, or guarantee as a real product fact;
- describes the photography using production language;
- contains an em dash, internal terminology, cheap generic filler, or obviously mechanical prose.

Fictional locations, actions, dialogue, personality, agency, tactile sensations, and erotic scenarios are allowed. They are creative fantasy, not product claims. Do not compare fictional actions with static source poses and do not reject a draft because the fantasy extends beyond what is literally pictured. Only flag sensory language when it is presented as a factual material claim, such as promising that silicone feels exactly like human skin.

Do not flag fictional expressions, movement, atmosphere, interaction, invitation, seduction, anticipation, or behavior. Those elements are the purpose of the fantasy. A visual expression may inspire a different fictional expression within the imagined scene without contradicting the real product.`;

Review the draft only. Do not flag words or punctuation that appear solely inside the evidence supplied for comparison. Do not rewrite the draft. Be strict and concise.`;

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--url") parsed.url = argv[++index];
    else if (token === "--output") parsed.output = argv[++index];
    else if (!token.startsWith("--") && !parsed.output) parsed.output = token;
  }
  return parsed;
}

function extractJson(raw) {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

async function callVenice({ model, messages, maxCompletionTokens = 1200 }) {
  const response = await fetch(VENICE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VENICE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.55,
      max_completion_tokens: maxCompletionTokens,
      messages,
      response_format: { type: "json_object" },
      venice_parameters: {
        include_venice_system_prompt: false,
        disable_thinking: true,
        strip_thinking_response: true,
        enable_web_search: "off",
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(`${model} returned ${response.status}: ${JSON.stringify(body)}`);
  return {
    content: extractJson(body.choices?.[0]?.message?.content || "{}"),
    usage: body.usage || null,
    cost: body.cost || null,
  };
}

function wordCount(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function runStaticChecks(draft) {
  const paragraph = draft.paragraph || "";
  const normalized = paragraph.toLowerCase();
  const banned = [
    "—",
    "not just",
    "unforgettable",
    "photos",
    "photo",
    "image",
    "gallery",
    "studio",
    "backdrop",
    "setting",
    "pose",
    "styling",
    "editorial",
    "seo",
    "product data",
    "visual narrative",
    "composition",
    "static display",
    "clearly adult",
  ];
  const failures = banned.filter((phrase) => normalized.includes(phrase.toLowerCase()));
  const count = wordCount(paragraph);
  if (count < 90 || count > 130) failures.push(`word_count_${count}`);
  return { passed: failures.length === 0, failures, wordCount: count };
}

async function main() {
  if (!process.env.VENICE_API_KEY) throw new Error("VENICE_API_KEY is required");

  const runProducts = args.url ? [await productFromUrl(args.url)] : products;
  const results = [];
  for (const product of runProducts) {
    const contactSheet = product.contactSheet || path.join("output/pdp-pilot-contact-sheets", `${product.handle}-contact.jpg`);
    const image = await fs.readFile(contactSheet, "base64");
    const extraction = await callVenice({
      model: EXTRACTOR_MODEL,
      messages: [
        { role: "system", content: "You are a precise visual evidence extractor for adult commerce. Return JSON only." },
        {
          role: "user",
          content: [
            { type: "text", text: extractorPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ],
        },
      ],
    });

    const attempts = [];
    let writing;
    let review;
    let staticChecks;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      writing = await callVenice({
        model: WRITER_MODEL,
        messages: [
          { role: "system", content: writerPrompt },
          {
            role: "user",
            content: JSON.stringify({
              verifiedFacts: product.facts,
              lockedVisibleEvidence: extraction.content.visibleStyling || [],
              dominantTheme: extraction.content.dominantTheme || null,
              themeEvidence: extraction.content.themeEvidence || [],
              excludedUncertainDetails: extraction.content.uncertainDetails || [],
              previousRejection: attempts.at(-1)?.review?.violations || attempts.at(-1)?.staticChecks?.failures || [],
            }),
          },
        ],
      });

      review = await callVenice({
        model: REVIEWER_MODEL,
        messages: [
          { role: "system", content: reviewerPrompt },
          {
            role: "user",
            content: JSON.stringify({
              verifiedFacts: product.facts,
              lockedVisibleEvidence: extraction.content.visibleStyling || [],
              dominantTheme: extraction.content.dominantTheme || null,
              themeEvidence: extraction.content.themeEvidence || [],
              uncertainDetails: extraction.content.uncertainDetails || [],
              draft: writing.content,
            }),
          },
        ],
      });

      staticChecks = runStaticChecks(writing.content);
      attempts.push({ attempt, draft: writing.content, staticChecks, review: review.content });
      if (staticChecks.passed && review.content.passed === true) break;
    }

    const reviewerPassed = review.content.passed === true;

    results.push({
      handle: product.handle,
      sourceUrl: product.sourceUrl || null,
      verifiedFacts: product.facts,
      sourceImages: product.sourceImages || Array.from({ length: 8 }, (_, index) => `/product-media/v4/${product.handle}/${index}?size=card`),
      extraction: extraction.content,
      draft: writing.content,
      staticChecks,
      reviewer: review.content,
      attempts,
      publishable: staticChecks.passed && reviewerPassed,
      provenance: {
        extractorModel: EXTRACTOR_MODEL,
        writerModel: WRITER_MODEL,
        reviewerModel: REVIEWER_MODEL,
        promptVersion: "pdp-editorial-fantasy-v3",
        generatedAt: new Date().toISOString(),
        extractorUsage: extraction.usage,
        writerUsage: writing.usage,
        extractorCost: extraction.cost,
        writerCost: writing.cost,
        reviewerUsage: review.usage,
        reviewerCost: review.cost,
        status: "draft_needs_human_review",
      },
    });
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(`Wrote ${results.length} review-only drafts to ${OUTPUT}`);
  for (const result of results) {
    console.log(`${result.handle}: ${result.publishable ? "machine gates pass" : "review required"}`);
  }
}

async function productFromUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.hostname !== "dollwow.com" && url.hostname !== "www.dollwow.com") throw new Error("Only DollWOW PDP URLs are supported");
  const handle = url.pathname.match(/^\/products\/([^/]+)\/?$/)?.[1];
  if (!handle) throw new Error("Expected a DollWOW /products/{handle} URL");

  const response = await fetch(url, { headers: { "User-Agent": "DollWOW editorial audit" } });
  if (!response.ok) throw new Error(`Could not read PDP (${response.status})`);
  const html = await response.text();
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => {
      try { return JSON.parse(match[1]); } catch { return null; }
    })
    .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
    .filter(Boolean);
  const product = schemas.find((entry) => entry["@type"] === "Product");
  if (!product) throw new Error("PDP did not expose Product structured data");

  const propertyValues = (name) => (product.additionalProperty || []).filter((entry) => entry.name === name).map((entry) => entry.value).filter(Boolean);
  const preferredProperty = (name) => propertyValues(name).find((value) => String(value).includes("/")) || propertyValues(name)[0];
  const facts = [
    product.brand?.name,
    product.name,
    product.material || preferredProperty("Material"),
    preferredProperty("Height"),
    preferredProperty("Weight"),
    preferredProperty("Cup size"),
    preferredProperty("Body type"),
    preferredProperty("Head model"),
  ].filter(Boolean);
  const sourceImages = (Array.isArray(product.image) ? product.image : [product.image])
    .filter(Boolean)
    .slice(0, 8)
    .map((image) => new URL(image, url).toString());
  if (sourceImages.length < 3) throw new Error("PDP needs at least three catalog images for visual evidence");

  const contactSheet = path.join("output/pdp-pilot-contact-sheets", `${handle}-contact-auto.jpg`);
  await buildContactSheet(sourceImages, contactSheet);
  return { handle, facts, sourceUrl: url.toString(), sourceImages, contactSheet };
}

async function buildContactSheet(urls, outputPath) {
  const tileWidth = 420;
  const tileHeight = 560;
  const columns = 4;
  const rows = Math.ceil(urls.length / columns);
  const tiles = await Promise.all(urls.map(async (url, index) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not read catalog image ${index + 1} (${response.status})`);
    const input = Buffer.from(await response.arrayBuffer());
    const buffer = await sharp(input).rotate().resize(tileWidth, tileHeight, { fit: "contain", background: "#f4eee9" }).jpeg({ quality: 88 }).toBuffer();
    return { input: buffer, left: (index % columns) * tileWidth, top: Math.floor(index / columns) * tileHeight };
  }));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp({ create: { width: columns * tileWidth, height: rows * tileHeight, channels: 3, background: "#f4eee9" } })
    .composite(tiles)
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
