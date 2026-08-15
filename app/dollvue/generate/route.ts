import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { getCustomizationConfig } from "@/lib/customization/configs";
import {
  buildDollVuePrompt,
  DOLLVUE_PROMPT_VERSION,
  resolveDollVueSelections,
  dollVueConfigForProduct,
  isDollVueProduct,
  isDollVueCatalogProduct,
} from "@/lib/dollvue/config";
import { sendDollVueLookEmail } from "@/lib/dollvue/email";
import { recordDollVuePreview, dollVueUsageForEmail } from "@/lib/dollvue/accountUsage";
import { readDollVueSession } from "@/lib/dollvue/session";
import { productDisplayName } from "@/lib/catalog/naming";
import { productImageSources } from "@/lib/catalog/productImage";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { env } from "@/lib/utils/env";

export const runtime = "nodejs";
export const maxDuration = 120;

const generationCache = new Map<string, { previewDataUrl: string; createdAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;
let generationDay = new Date().toISOString().slice(0, 10);
let generatedToday = 0;
const requestWindows = new Map<string, { count: number; resetsAt: number }>();

const schema = z.object({
  productHandle: z.string().min(1).max(180),
  sourcePosition: z.number().int().min(0).max(7),
  selections: z.array(z.object({ groupId: z.string().min(1).max(100), optionId: z.string().min(1).max(100) })).min(1).max(2)
});

const ALLOWED_COUNTRIES = new Set([
  "US", "CA", "GB", "AU", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "CH"
]);

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return apiError("This request could not be verified.", 403);
  if (!env.VENICE_API_KEY) return NextResponse.json({ error: "DollVue™ is not connected yet." }, { status: 503 });
  if (env.DOLLVUE_ENABLED !== "true") return NextResponse.json({ error: "DollVue™ is temporarily unavailable. Please try again shortly." }, { status: 503 });
  const session = readDollVueSession(request.headers.get("cookie"));
  if (!session) return NextResponse.json({ error: "Verify your email to use DollVue™." }, { status: 401 });
  const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
  if (country && !ALLOWED_COUNTRIES.has(country)) return NextResponse.json({ error: "DollVue™ is not available in your region yet." }, { status: 403 });
  const clientKey = clientFingerprint(request);
  if (!allowRequest(clientKey)) return apiError("Too many preview requests. Please wait a little before trying again.", 429);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a photo and at least one available appearance option." }, { status: 400 });
  if (!isDollVueProduct(parsed.data.productHandle)) return NextResponse.json({ error: "This preview choice is not currently available for this doll." }, { status: 404 });
  const usage = await dollVueUsageForEmail(session.email);
  if (!usage.available) return NextResponse.json({ error: "DollVue™ usage tracking is temporarily unavailable. Please try again shortly." }, { status: 503 });
  if (usage.remaining <= 0) return NextResponse.json({ error: "You have used your five complimentary previews. Save this look or contact DollWOW and we will help you compare the options." }, { status: 429 });

  const product = await getProductByHandle(parsed.data.productHandle, { cache: "force-cache", revalidate: 3600 });
  if (!product || !isDollVueCatalogProduct(product)) return NextResponse.json({ error: "This doll is not currently available in DollVue™." }, { status: 404 });
  const sources = productImageSources(product);
  const source = sources[parsed.data.sourcePosition];
  if (!source?.url) return NextResponse.json({ error: "This photo could not be used for a preview. Choose another product photo and try again." }, { status: 400 });

  const config = dollVueConfigForProduct(product, getCustomizationConfig(product));
  const selections = resolveDollVueSelections(config, parsed.data.selections);
  if (!selections.length) return NextResponse.json({ error: "Those visual options are not available for this doll." }, { status: 400 });
  const optionImages = await Promise.all(selections.map(async ({ option }) => {
    if (option.swatch?.kind !== "image") return "";
    return normalizeOptionReference(option.swatch.value);
  }));
  const references = optionImages.filter(Boolean);
  const images = [source.url, ...references];
  const cacheKey = `${DOLLVUE_PROMPT_VERSION}:${product.handle}:${parsed.data.sourcePosition}:${selections.map(({ group, option }) => `${group.id}:${option.id}`).sort().join("|")}`;
  const cached = generationCache.get(cacheKey);
  const cachedPreview = cached && Date.now() - cached.createdAt < CACHE_TTL_MS ? cached.previewDataUrl : null;
  if (cached && !cachedPreview) generationCache.delete(cacheKey);
  const today = new Date().toISOString().slice(0, 10);
  if (today !== generationDay) {
    generationDay = today;
    generatedToday = 0;
  }
  const dailyLimit = Math.max(1, Number.parseInt(env.DOLLVUE_DAILY_LIMIT || "25", 10) || 25);
  if (!cachedPreview && generatedToday >= dailyLimit) {
    return NextResponse.json({ error: "DollVue™ has reached today’s preview limit. Please try again tomorrow." }, { status: 429 });
  }

  const generated = cachedPreview ? null : await generatePreview({
    images,
    prompt: buildDollVuePrompt(product, selections),
    aspectRatio: closestDollVueAspectRatio(source.width, source.height)
  });

  if (generated && !generated.ok) {
    console.error("Venice DollVue generation failed", generated.status, generated.detail.slice(0, 500));
    const message = generated.status === 402 ? "DollVue™ is temporarily unavailable. Please try again shortly." : generated.status === 429 ? "DollVue™ is busy. Please try again shortly." : generated.status === 422 ? "This photo could not be processed. Try again or choose another product photo." : "We couldn’t create this preview. Your selections are still here, so you can try again.";
    return apiError(message, generated.status === 429 ? 429 : 502);
  }
  let previewDataUrl = cachedPreview;
  if (!previewDataUrl && generated?.ok) {
    previewDataUrl = `data:image/webp;base64,${generated.bytes.toString("base64")}`;
    generationCache.set(cacheKey, { previewDataUrl, createdAt: Date.now() });
    generatedToday += 1;
  }
  if (!previewDataUrl) return NextResponse.json({ error: "We couldn’t create this preview. Your selections are still here, so you can try again." }, { status: 502 });
  const displayName = productDisplayName(product) || product.title;
  const productUrl = `${env.NEXT_PUBLIC_SITE_URL}/products/${product.handle}`;
  const recorded = await recordDollVuePreview({
    email: session.email,
    model: generated?.model || "cache",
    productHandle: product.handle,
    selectionCount: selections.length,
    cacheHit: Boolean(cachedPreview),
    country
  });
  if (!recorded) return NextResponse.json({ error: "DollVue™ could not save this preview to your allowance. Please try again shortly." }, { status: 503 });
  const updatedUsage = await dollVueUsageForEmail(session.email);
  const email = await sendDollVueLookEmail({
      to: session.email,
      productName: displayName,
      productUrl,
      sourceImageUrl: source.url,
      previewDataUrl,
      selections: selections.map(({ group, option }) => ({ group: group.label, option: option.label }))
    });
  console.info("DollVue generation", JSON.stringify({ model: generated?.model || "cache", resolution: generated?.resolution || "cache", cacheHit: Boolean(cachedPreview), country: country || "unknown", selections: selections.length, emailDelivered: email.delivered, emailProvider: "provider" in email ? email.provider : "none" }));
  return NextResponse.json({
    previewDataUrl,
    remaining: updatedUsage.remaining,
    emailDelivered: email.delivered,
    selections: selections.map(({ group, option }) => ({ groupId: group.id, group: group.label, optionId: option.id, option: option.label }))
  }, { headers: { "Cache-Control": "no-store" } });
}

function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const expected = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
    const actual = new URL(origin).origin;
    if (actual === expected) return true;
    return process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(actual);
  } catch {
    return false;
  }
}

function clientFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}:${new Date().toISOString().slice(0, 10)}`).digest("hex");
}

function allowRequest(key: string) {
  const now = Date.now();
  const existing = requestWindows.get(key);
  if (!existing || existing.resetsAt <= now) {
    requestWindows.set(key, { count: 1, resetsAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (existing.count >= 6) return false;
  existing.count += 1;
  return true;
}

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function generatePreview({ images, prompt, aspectRatio }: {
  images: string[];
  prompt: string;
  aspectRatio: ReturnType<typeof closestDollVueAspectRatio>;
}): Promise<
  | { ok: true; bytes: Buffer; model: string; resolution: string }
  | { ok: false; status: number; detail: string }
> {
  if (!env.VENICE_API_KEY) return { ok: false, status: 503, detail: "Missing Venice API key" };

  const seedream = await requestVeniceEdit({
    modelId: "seedream-v5-pro-edit",
    images,
    prompt,
    aspectRatio,
    resolution: "2K"
  });
  if (seedream.ok) return { ok: true, bytes: await normalizePreview(seedream.bytes), model: "seedream-v5-pro-edit", resolution: "2K" };
  if (seedream.status !== 422) return seedream;

  const seedreamLite = await requestVeniceEdit({
    modelId: "seedream-v5-lite-edit",
    images,
    prompt,
    aspectRatio,
    resolution: "2K"
  });
  if (seedreamLite.ok) return { ok: true, bytes: await normalizePreview(seedreamLite.bytes), model: "seedream-v5-lite-edit", resolution: "2K" };
  console.error("Venice DollVue Seedream Lite fallback failed", seedreamLite.status, seedreamLite.detail.slice(0, 500));

  const qwen = await requestVeniceEdit({
    modelId: "qwen-edit-uncensored",
    images,
    prompt,
    aspectRatio,
    resolution: "2K"
  });
  if (qwen.ok) return { ok: true, bytes: await normalizePreview(qwen.bytes), model: "qwen-edit-uncensored", resolution: "2K" };
  console.error("Venice DollVue Qwen fallback failed", qwen.status, qwen.detail.slice(0, 500));
  return qwen;
}

async function requestVeniceEdit({ modelId, images, prompt, aspectRatio, resolution, quality }: {
  modelId: string;
  images: string[];
  prompt: string;
  aspectRatio: ReturnType<typeof closestDollVueAspectRatio>;
  resolution: "2K" | "4K";
  quality?: "medium";
}): Promise<{ ok: true; bytes: Buffer } | { ok: false; status: number; detail: string }> {
  const response = await fetch("https://api.venice.ai/api/v1/image/multi-edit", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.VENICE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      modelId,
      images,
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
      ...(quality ? { quality } : {}),
      output_format: "webp",
      safe_mode: false,
      enhance_prompt: false,
      disable_prompt_optimization_thinking: true
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(105_000)
  });
  if (!response.ok) return { ok: false, status: response.status, detail: await response.text() };
  return { ok: true, bytes: Buffer.from(await response.arrayBuffer()) };
}

async function normalizePreview(bytes: Buffer) {
  const metadata = await sharp(bytes).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const resize = Math.max(width, height) > 3840
    ? (width >= height ? { width: 3840 } : { height: 3840 })
    : undefined;
  const normalized = await sharp(bytes).resize(resize).webp({ quality: 91, effort: 4 }).toBuffer();
  const finalMetadata = await sharp(normalized).metadata();
  const finalWidth = finalMetadata.width ?? 1600;
  const finalHeight = finalMetadata.height ?? 1600;
  return sharp(normalized)
    .composite([{ input: dollVueWatermark(finalWidth, finalHeight), gravity: "southeast" }])
    .webp({ quality: 91, effort: 4 })
    .toBuffer();
}

function dollVueWatermark(width: number, height: number) {
  const fontSize = Math.max(22, Math.round(Math.min(width, height) * 0.026));
  const horizontal = Math.max(18, Math.round(fontSize * 0.72));
  const vertical = Math.max(12, Math.round(fontSize * 0.44));
  const label = "DOLLWOW.COM · DOLLVUE™";
  const boxWidth = Math.round(label.length * fontSize * 0.61 + horizontal * 2);
  const boxHeight = fontSize + vertical * 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${boxWidth}" height="${boxHeight}">
    <rect width="100%" height="100%" rx="${Math.round(boxHeight / 2)}" fill="#160f0c" fill-opacity=".58"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#fff8f2" fill-opacity=".86" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="${Math.max(1, Math.round(fontSize * 0.08))}">${label}</text>
  </svg>`);
}

async function normalizeOptionReference(url: string) {
  try {
    const response = await fetch(url, { cache: "force-cache", next: { revalidate: 86400 } });
    if (!response.ok) return url;
    const bytes = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(bytes).metadata();
    if ((metadata.width ?? 0) >= 256 && (metadata.height ?? 0) >= 256) return url;
    const normalized = await sharp(bytes).resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).webp({ quality: 92 }).toBuffer();
    return `data:image/webp;base64,${normalized.toString("base64")}`;
  } catch {
    return url;
  }
}

function closestDollVueAspectRatio(width?: number | null, height?: number | null) {
  const ratio = width && height ? width / height : 3 / 4;
  const supported = [
    ["1:1", 1],
    ["3:2", 3 / 2],
    ["16:9", 16 / 9],
    ["21:9", 21 / 9],
    ["9:16", 9 / 16],
    ["2:3", 2 / 3],
    ["3:4", 3 / 4],
    ["4:5", 4 / 5]
  ] as const;
  return supported.reduce((closest, candidate) =>
    Math.abs(candidate[1] - ratio) < Math.abs(closest[1] - ratio) ? candidate : closest
  )[0];
}
