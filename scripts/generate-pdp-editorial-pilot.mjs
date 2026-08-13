#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const VENICE_ENDPOINT = "https://api.venice.ai/api/v1/chat/completions";
const EXTRACTOR_MODEL = process.env.PDP_EDITORIAL_EXTRACTOR_MODEL || "qwen3-vl-235b-a22b";
const THEME_MODEL = process.env.PDP_EDITORIAL_THEME_MODEL || "openai-gpt-54-mini";
const WRITER_MODEL = process.env.PDP_EDITORIAL_WRITER_MODEL || "gemma-4-uncensored";
const REVIEWER_MODEL = process.env.PDP_EDITORIAL_REVIEWER_MODEL || "venice-uncensored-1-2";
const SELECTOR_MODEL = process.env.PDP_EDITORIAL_SELECTOR_MODEL || "openai-gpt-54-mini";
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
    facts: ["Brand: Piper", "Doll name: Lana", "clearly adult doll", "full silicone", "155 cm (5 ft 1 in)", "F-cup"],
  },
  {
    handle: "irontech-kevin-176cm-silicone-companion-doll-is1mv",
    facts: ["Irontech Kevin", "clearly adult male doll", "full silicone", "176 cm (5 ft 9 in)"],
  },
];

const extractorPrompt = `Analyze this supplier-authorized contact sheet for one clearly adult doll product. Return strict JSON only with:
- appearance: hair, eyes, makeup, expression, and visible body presentation
- wardrobe: visible garment shapes, colors, patterns, and accessories described neutrally without naming an occupation, sport, role, or aesthetic
- sceneAnchors: large or distinctive physical objects, each with objectName, confidence, framesSeen, and visualEvidence
- environment: recognizable furniture, room type, architecture, landscape, and surroundings
- printedText: words, logos, numbers, and labels visible on clothing or props, kept separate from physical evidence
- poses: consistently visible body positions and gestures
- lightingAndPalette: lighting and dominant colors
- uncertainDetails: anything partly obscured, inconsistent, or unsafe to state confidently
- prohibitedInferences: personality, feelings, agency, function, movement, realism, included items, performance, or buyer outcomes that must not be inferred

Describe only visible evidence. Do not interpret a prop as an included accessory. Do not identify a real person. Do not force a theme when evidence is ambiguous.`;

const themePrompt = `Resolve the dominant visual theme of this clearly adult doll gallery from a neutral visual evidence record. Return strict JSON with dominantTheme, confidence, themeEvidence, conflictingEvidence, and rationale.

Use these general evidence rules:
- Prefer distinctive physical objects, recognizable environments, and coherent cues repeated across multiple frames.
- Map a specialized implement to its conventional activity when confidence is high.
- Preserve a recognizable room or environment in the result when it meaningfully shapes the scene.
- Use wardrobe as supporting context after physical anchors and environment.
- Give moderate weight to garment shapes, color systems, and specialized accessories when they reinforce the scene-defining evidence.
- Give low weight to everyday objects such as phones, headphones, bracelets, generic furniture, and plain clothing unless several of them jointly establish an unmistakable context.
- Printed words and logos are intentionally excluded from this evidence record and must not be guessed.
- Combine compatible activity, environment, and wardrobe evidence into a useful specific label rather than reducing the result to generic fashion, product display, studio portrait, or casual streetwear.
- Choose the most specific defensible theme. Return "no clear theme" with low confidence when no interpretation has sufficient support.
- Do not identify a real person or infer product capabilities, included accessories, personality, or buyer outcomes.`;

const writerPrompt = `You are the senior adult-commerce copywriter for DollWOW. Write premium, sensual, erotically persuasive American English for a clearly adult sex doll.

Approved DollWOW voice reference:
"Imagine the final inning is over and Evie has saved the real game for somewhere private. Her red visor sits above long brown waves, red glasses frame her blue eyes, and an open baseball jacket reveals the fitted blue top beneath. Softly parted lips and an F-cup silhouette give the sporty look a distinctly adult edge. At 161 cm (5 ft 3 in), her full-silicone build brings bold curves to the fantasy. Pull her close by the waist, slip the silver headphones from her neck, and take your time with every playful detail. With Evie, the scoreboard can wait. This is the kind of extra inning meant to be enjoyed behind closed doors."

Requirements:
- Return strict JSON with eyebrow, heading, and paragraph only.
- Paragraph must be 90-130 words.
- Use the verified facts and visual brief as creative inspiration for an adult fantasy that could only have been written for this particular doll.
- Match the reference's confident cadence, specificity, sensual escalation, factual restraint, and memorable final line. Do not copy its baseball scenario, phrases, sentence openings, or props.
- Let the fantasy unfold naturally. The doll may have a voice, personality, agency, and initiative within the fictional scene.
- Every factual detail about appearance, clothing, measurements, material, or product construction must come from the verified facts or neutral visual evidence. You may freely invent the adult fantasy's actions, private setting, dialogue, mood, and encounter.
- Address the doll by the supplied Doll name. Never combine the Brand and Doll name into a personal name.
- Do not invent tactile qualities, temperature, scent, realism, performance, capabilities, included accessories, availability, or guarantees.
- Use the styling and surroundings to inspire the fantasy, but do not narrate a plain photography setup. The finished copy must not discuss photographs, galleries, studios, source material, analysis, prompts, SEO, or content production.
- Use US and metric measurements exactly as supplied if measurements appear.
- Keep it seductive and confident without sounding cheap, repetitive, or mechanically generated.
- Every subject is an adult. Never use youth-coded, school-coded, childlike, innocent, barely legal, teen, girl-next-door, petite-girl, or age-ambiguous framing.
- Do not use an em dash or the construction "not just X, but Y."
- The eyebrow and heading should extend the fantasy, not label the section as an editorial description.`;

const reviewerPrompt = `Audit only the supplied adult fantasy copy for false commerce claims and internal-language leakage. Return strict JSON with passed, violations, and notes.

Fail the draft if it:
- contradicts the verified identity, appearance, or dominant visual theme;
- states a false or invented height, weight, material, cup size, body type, mechanical or electronic function, included accessory, price, stock status, delivery promise, warranty, or guarantee as a real product fact;
- describes the photography using production language;
- contains an em dash, internal terminology, cheap generic filler, or obviously mechanical prose.

Treat every narrative detail as fiction unless it explicitly claims to be a product specification, included item, capability, price, stock status, delivery promise, warranty, or guarantee. Fictional locations, actions, dialogue, personality, movement, atmosphere, touch, warmth, softness, erotic interaction, and emotional language always pass. The doll may act autonomously inside the fantasy.

Verified facts may be woven naturally into the fantasy without labels or citations. Never fail a correct height, weight, material, cup size, body type, hair color, eye color, or wardrobe detail merely because it appears in narrative prose. Fail only when it contradicts or goes beyond the supplied facts and visual evidence.

Review the draft only. Do not flag words or punctuation that appear solely inside the evidence supplied for comparison. Do not rewrite the draft. Be strict and concise.`;

const selectorPrompt = `Select the stronger of two adult-commerce drafts. Return strict JSON with selectedCandidate (1 or 2), scores, rejectionReasons, and rationale.

Score each candidate from 1-10 on:
- factual fidelity to verified facts and neutral visual evidence, including exact hair, eye, wardrobe, body, and measurement details;
- specificity to this particular doll;
- similarity in cadence and polish to the approved DollWOW Evie voice reference supplied in the writer prompt;
- sensual persuasion without cheap, repetitive, awkward, generic, or mechanically generated prose;
- customer-facing language with no photography, gallery, analysis, SEO, or content-production terminology.

Reject any candidate that contradicts a visible fact, repeats a conspicuous word or idea, misuses grammar, introduces youth-coded language, or makes a false commerce claim. Fictional action, agency, dialogue, atmosphere, touch, warmth, and erotic scenarios are allowed. Choose the better candidate even when both need later human review.`;

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--url") parsed.url = argv[++index];
    else if (token === "--urls-file") parsed.urlsFile = argv[++index];
    else if (token === "--output") parsed.output = argv[++index];
    else if (token === "--concurrency") parsed.concurrency = argv[++index];
    else if (token === "--resume") parsed.resume = true;
    else if (token === "--theme-only") parsed.themeOnly = true;
    else if (token === "--eligibility-only") parsed.eligibilityOnly = true;
    else if (token === "--resolve-theme") parsed.resolveTheme = true;
    else if (!token.startsWith("--") && !parsed.output) parsed.output = token;
  }
  return parsed;
}

function extractJson(raw) {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

async function callVenice({ model, messages, maxCompletionTokens = 1200 }) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(VENICE_ENDPOINT, {
        method: "POST",
        signal: AbortSignal.timeout(45_000),
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
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    }
  }
  throw lastError;
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
    "realistic presence",
    "realistic experience",
    "tactile luxury",
    "tactile reality",
    "supple skin",
    "skin feels warm",
    "warmth of her skin",
    "innocence",
    "innocent",
    "schoolgirl",
    "school girl",
    "school-girl",
    "childlike",
    "child-like",
    "barely legal",
    "teen",
    "girl next door",
    "girl-next-door",
    "in this photo",
    "in the photo",
    "product photo",
    "product image",
    "the image shows",
    "the gallery shows",
    "this gallery",
    "contact sheet",
    "studio",
    "studio lighting",
    "editorial copy",
    "visual evidence",
    "source material",
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
  if (!args.eligibilityOnly && !process.env.VENICE_API_KEY) throw new Error("VENICE_API_KEY is required");

  const inputUrls = args.urlsFile
    ? (await fs.readFile(args.urlsFile, "utf8")).split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
    : args.url ? [args.url] : [];
  const existingResults = args.resume ? await readExistingResults() : [];
  const completedHandles = new Set(
    existingResults
      .filter((result) => ["draft_needs_human_review", "excluded_not_full_body"].includes(result.provenance?.status))
      .map((result) => result.handle)
  );
  const pendingUrls = inputUrls.filter((url) => !completedHandles.has(handleFromUrl(url)));
  const runProducts = inputUrls.length
    ? await mapWithConcurrency(pendingUrls, 12, safeProductFromUrl)
    : products.map((product) => ({ ...product, eligibility: { eligible: true, reason: "approved_pilot_fixture" } }));

  if (args.eligibilityOnly) {
    const eligibilityResults = runProducts.map((product) => ({
      handle: product.handle,
      sourceUrl: product.sourceUrl || null,
      eligibility: product.eligibility,
    }));
    await writeResults(eligibilityResults);
    console.log(`Wrote ${eligibilityResults.length} eligibility results to ${OUTPUT}`);
    return;
  }

  const results = [...existingResults];
  const concurrency = Math.max(1, Number(args.concurrency || 2));
  for (let offset = 0; offset < runProducts.length; offset += concurrency) {
    const batch = await Promise.all(runProducts.slice(offset, offset + concurrency).map(async (product) => {
    if (product.inputError) {
      return failedResult(product, "input_failed", product.inputError);
    }
    if (product.eligibility?.eligible !== true) {
      return {
        handle: product.handle,
        sourceUrl: product.sourceUrl || null,
        verifiedFacts: product.facts,
        eligibility: product.eligibility,
        publishable: false,
        provenance: {
          promptVersion: "pdp-editorial-fantasy-v5",
          generatedAt: new Date().toISOString(),
          status: "excluded_not_full_body",
        },
      };
    }

    try {
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

    const neutralEvidence = themeEvidenceRecord(extraction.content);
    const theme = args.resolveTheme
      ? await callVenice({
          model: THEME_MODEL,
          messages: [
            { role: "system", content: "You are an independent visual evidence judge for adult commerce. Return JSON only." },
            { role: "user", content: `${themePrompt}\n\nNeutral visual evidence:\n${JSON.stringify(neutralEvidence)}` },
          ],
        })
      : { content: { dominantTheme: null, confidence: null, themeEvidence: [], rationale: "Writer receives neutral visual evidence directly." }, usage: null, cost: null, attempts: 0 };

    if (args.themeOnly) {
      return {
        handle: product.handle,
        sourceUrl: product.sourceUrl || null,
        verifiedFacts: product.facts,
        extraction: extraction.content,
        theme: theme.content,
        publishable: false,
        provenance: {
          extractorModel: EXTRACTOR_MODEL,
          themeModel: THEME_MODEL,
          promptVersion: "pdp-editorial-theme-v1",
          generatedAt: new Date().toISOString(),
          extractorCost: extraction.cost,
          themeCost: theme.cost,
          status: "theme_review_only",
        },
      };
    }

    const attempts = await Promise.all([1, 2].map(async (attempt) => {
      const writing = await callVenice({
        model: WRITER_MODEL,
        messages: [
          { role: "system", content: writerPrompt },
          {
            role: "user",
            content: JSON.stringify({
              verifiedFacts: product.facts,
              neutralVisualEvidence: neutralEvidence,
              dominantTheme: theme.content.dominantTheme || null,
              themeConfidence: theme.content.confidence || null,
              themeEvidence: theme.content.themeEvidence || [],
              excludedUncertainDetails: extraction.content.uncertainDetails || [],
              creativeDirection: `Candidate ${attempt}: choose your own distinct fantasy angle and phrasing.`,
            }),
          },
        ],
      });

      const review = await callVenice({
        model: REVIEWER_MODEL,
        messages: [
          { role: "system", content: reviewerPrompt },
          {
            role: "user",
            content: JSON.stringify({
              verifiedFacts: product.facts,
              neutralVisualEvidence: neutralEvidence,
              dominantTheme: theme.content.dominantTheme || null,
              themeConfidence: theme.content.confidence || null,
              themeEvidence: theme.content.themeEvidence || [],
              uncertainDetails: extraction.content.uncertainDetails || [],
              draft: writing.content,
            }),
          },
        ],
      });

      const staticChecks = runStaticChecks(writing.content);
      return {
        attempt,
        draft: writing.content,
        staticChecks,
        review: review.content,
        writerCost: writing.cost,
        reviewerCost: review.cost,
      };
    }));

    const passingAttempts = attempts.filter((attempt) => attempt.staticChecks.passed && attempt.review.passed === true);
    const selection = passingAttempts.length === 2
      ? await callVenice({
          model: SELECTOR_MODEL,
          messages: [
            { role: "system", content: selectorPrompt },
            {
              role: "user",
              content: JSON.stringify({
                verifiedFacts: product.facts,
                neutralVisualEvidence: neutralEvidence,
                candidates: attempts.map(({ attempt, draft, staticChecks, review }) => ({ attempt, draft, staticChecks, review })),
              }),
            },
          ],
        })
      : {
          content: {
            selectedCandidate: passingAttempts[0]?.attempt || 1,
            rationale: passingAttempts.length === 1
              ? "Selected the only candidate that passed both machine gates."
              : "No candidate passed both machine gates; retained candidate 1 for human review only.",
          },
          usage: null,
          cost: null,
        };

    const selectedIndex = selection.content.selectedCandidate === 2 ? 1 : 0;
    const selected = attempts[selectedIndex];
    const writing = { content: selected.draft, cost: selected.writerCost, usage: null };
    const review = { content: selected.review, cost: selected.reviewerCost, usage: null };
    const staticChecks = selected.staticChecks;

    const reviewerPassed = review.content.passed === true;

    return {
      handle: product.handle,
      sourceUrl: product.sourceUrl || null,
      verifiedFacts: product.facts,
      eligibility: product.eligibility,
      sourceImages: product.sourceImages || Array.from({ length: 8 }, (_, index) => `/product-media/v4/${product.handle}/${index}?size=card`),
      extraction: extraction.content,
      theme: theme.content,
      draft: writing.content,
      staticChecks,
      reviewer: review.content,
      selection: selection.content,
      attempts,
      publishable: staticChecks.passed && reviewerPassed,
      provenance: {
        extractorModel: EXTRACTOR_MODEL,
        themeModel: THEME_MODEL,
        writerModel: WRITER_MODEL,
        reviewerModel: REVIEWER_MODEL,
        selectorModel: SELECTOR_MODEL,
        promptVersion: "pdp-editorial-fantasy-v5",
        generatedAt: new Date().toISOString(),
        extractorUsage: extraction.usage,
        writerUsage: writing.usage,
        extractorCost: extraction.cost,
        themeUsage: theme.usage,
        themeCost: theme.cost,
        writerCost: writing.cost,
        reviewerUsage: review.usage,
        reviewerCost: review.cost,
        selectorUsage: selection.usage,
        selectorCost: selection.cost,
        status: "draft_needs_human_review",
      },
    };
    } catch (error) {
      return failedResult(product, "generation_failed", error instanceof Error ? error.message : String(error));
    }
    }));
    for (const result of batch) {
      const priorIndex = results.findIndex((entry) => entry.handle === result.handle);
      if (priorIndex >= 0) results[priorIndex] = result;
      else results.push(result);
    }
    await writeResults(results);
    console.log(`Checkpoint: ${results.length} total results, ${Math.min(offset + concurrency, runProducts.length)}/${runProducts.length} pending products processed`);
  }

  console.log(`Wrote ${results.length} review-only drafts to ${OUTPUT}`);
  for (const result of results) {
    console.log(`${result.handle}: ${result.publishable ? "machine gates pass" : "review required"}`);
  }
}

async function readExistingResults() {
  try {
    const existing = JSON.parse(await fs.readFile(OUTPUT, "utf8"));
    return Array.isArray(existing.results) ? existing.results : [];
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function safeProductFromUrl(url) {
  try {
    return await productFromUrl(url);
  } catch (error) {
    return {
      handle: handleFromUrl(url),
      sourceUrl: url,
      inputError: error instanceof Error ? error.message : String(error),
    };
  }
}

function failedResult(product, status, error) {
  return {
    handle: product.handle,
    sourceUrl: product.sourceUrl || null,
    verifiedFacts: product.facts || [],
    eligibility: product.eligibility || null,
    publishable: false,
    error,
    provenance: {
      promptVersion: "pdp-editorial-fantasy-v5",
      generatedAt: new Date().toISOString(),
      status,
    },
  };
}

function handleFromUrl(rawUrl) {
  try {
    return new URL(rawUrl).pathname.match(/^\/products\/([^/]+)\/?$/)?.[1] || rawUrl;
  } catch {
    return rawUrl;
  }
}

function themeEvidenceRecord(extraction) {
  return {
    appearance: extraction.appearance || extraction.visibleStyling || null,
    wardrobe: extraction.wardrobe || null,
    sceneAnchors: extraction.sceneAnchors || [],
    environment: extraction.environment || null,
    poses: extraction.poses || null,
    lightingAndPalette: extraction.lightingAndPalette || null,
    uncertainDetails: extraction.uncertainDetails || [],
  };
}

async function writeResults(results) {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
}

async function mapWithConcurrency(values, concurrency, worker) {
  const results = new Array(values.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await worker(values[index]);
    }
  }));
  return results;
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
  const eligibility = fullBodyEligibility(product, propertyValues, preferredProperty);
  const facts = [
    product.brand?.name ? `Brand: ${product.brand.name}` : null,
    dollNameFromProduct(product) ? `Doll name: ${dollNameFromProduct(product)}` : null,
    product.name ? `Catalog title: ${product.name}` : null,
    product.material || preferredProperty("Material"),
    preferredProperty("Height"),
    preferredProperty("Weight"),
    preferredProperty("Cup size"),
    preferredProperty("Body type"),
    preferredProperty("Head model"),
  ].filter(Boolean);
  if (!eligibility.eligible || args.eligibilityOnly) {
    return { handle, facts, sourceUrl: url.toString(), sourceImages: [], eligibility };
  }

  const sourceImages = (Array.isArray(product.image) ? product.image : [product.image])
    .filter(Boolean)
    .slice(0, 8)
    .map((image) => new URL(image, url).toString());
  if (sourceImages.length < 3) throw new Error("PDP needs at least three catalog images for visual evidence");

  const contactSheet = path.join("output/pdp-pilot-contact-sheets", `${handle}-contact-auto.jpg`);
  await buildContactSheet(sourceImages, contactSheet);
  return { handle, facts, sourceUrl: url.toString(), sourceImages, contactSheet, eligibility };
}

function dollNameFromProduct(product) {
  let name = String(product.name || "").trim();
  const brand = String(product.brand?.name || "").trim();
  if (brand) {
    const leadingBrand = new RegExp(`^(?:${escapeRegExp(brand)}\\s*)+`, "i");
    name = name.replace(leadingBrand, "").trim();
  }
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*cm\b.*$/i, "")
    .replace(/\s+(?:customizable|ready-to-ship|companion|sex)\s+doll\b.*$/i, "")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fullBodyEligibility(product, propertyValues, preferredProperty) {
  const text = [
    product.name,
    product.description,
    product.category,
    product.material,
    ...propertyValues("Body type"),
  ].filter(Boolean).join(" ").toLowerCase();
  if (/\b(replacement head|standalone head|doll head|head only|torsos?|upper body|half body|partial body|body only|hips?|hip torso|lower body|butt(?:ocks?)?)\b/.test(text)) {
    return { eligible: false, reason: "explicit_partial_body_signal" };
  }

  const heightCm = metricNumber(preferredProperty("Height"), "cm");
  if (!heightCm) return { eligible: false, reason: "height_unverified" };
  if (heightCm > 120) return { eligible: true, reason: "verified_full_size_height", heightCm };

  const limbMeasurements = ["Feet Length", "Legs Length", "Arms Length"]
    .map((name) => preferredProperty(name));
  const hasCompleteLimbProfile = limbMeasurements.every(isAvailableMeasurement);
  return hasCompleteLimbProfile
    ? { eligible: true, reason: "verified_compact_full_body_measurements", heightCm }
    : { eligible: false, reason: "compact_product_without_full_limb_profile", heightCm };
}

function metricNumber(value, unit) {
  const match = String(value || "").match(new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*${unit}\\b`, "i"));
  return match ? Number(match[1]) : 0;
}

function isAvailableMeasurement(value) {
  return Boolean(value) && !/^(?:n\/?a|none|unknown|not available|-|0)$/i.test(String(value).trim());
}

async function buildContactSheet(urls, outputPath) {
  const tileWidth = 420;
  const tileHeight = 560;
  const columns = 4;
  const settled = await Promise.allSettled(urls.map(async (url, sourceIndex) => {
    let lastStatus = 0;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      lastStatus = response.status;
      if (response.ok) {
        const input = Buffer.from(await response.arrayBuffer());
        const buffer = await sharp(input).rotate().resize(tileWidth, tileHeight, { fit: "contain", background: "#f4eee9" }).jpeg({ quality: 88 }).toBuffer();
        return { input: buffer, sourceIndex };
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 750));
    }
    throw new Error(`Could not read catalog image ${sourceIndex + 1} (${lastStatus})`);
  }));
  const usable = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
  if (usable.length < 3) throw new Error(`Only ${usable.length} usable catalog images remained; at least 3 are required`);
  const rows = Math.ceil(usable.length / columns);
  const tiles = usable.map(({ input }, index) => ({
    input,
    left: (index % columns) * tileWidth,
    top: Math.floor(index / columns) * tileHeight,
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
