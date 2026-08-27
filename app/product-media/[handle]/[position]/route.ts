import sharp from "sharp";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { productImageSources } from "@/lib/catalog/productImage";

export const runtime = "nodejs";

const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const GOLD = "#d7a846";
let watermarkLogoPromise: Promise<Buffer> | null = null;

export async function GET(request: Request, { params }: { params: Promise<{ handle: string; position: string }> }) {
  const { handle, position: rawPosition } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,180}$/i.test(handle)) {
    return new Response("Invalid product", {
      status: 400,
      headers: { "Cache-Control": "no-store" }
    });
  }
  const position = Number.parseInt(rawPosition, 10);
  if (!Number.isInteger(position) || position < 0 || position > 100) {
    return new Response("Invalid image", {
      status: 400,
      headers: { "Cache-Control": "no-store" }
    });
  }
  const requestedSize = new URL(request.url).searchParams.get("size");
  const bounds = requestedSize === "thumb"
    ? { width: 240, height: 320 }
    : requestedSize === "card"
      ? { width: 720, height: 960 }
      : { width: 1800, height: 2400 };

  const product = await getProductByHandle(handle, { revalidate: 120 });
  const source = product ? productImageSources(product)[position] : null;
  if (!source?.url) {
    return new Response("Image not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const upstream = await fetch(source.url, { next: { revalidate: 86400 } });
  if (!upstream.ok) {
    return new Response("Image unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
  const declaredLength = Number(upstream.headers.get("content-length") || 0);
  if (declaredLength > MAX_SOURCE_BYTES) {
    return new Response("Image too large", {
      status: 413,
      headers: { "Cache-Control": "no-store" }
    });
  }
  const input = Buffer.from(await upstream.arrayBuffer());
  if (input.byteLength > MAX_SOURCE_BYTES) {
    return new Response("Image too large", {
      status: 413,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const normalized = await sharp(input)
    .rotate()
    .resize({ ...bounds, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const width = normalized.info.width;
  const height = normalized.info.height;
  const shouldWatermark = requestedSize !== "thumb" && requestedSize !== "card";
  let output = normalized.data;
  if (shouldWatermark) {
    const sourceLogo = await watermarkLogo(new URL("/images/brand/dollwow-black-gold-lockup.png", request.url));
    const mark = await sharp(sourceLogo)
      .resize({ width: Math.max(250, Math.round(width * 0.44)), withoutEnlargement: true })
      .ensureAlpha()
      .linear([0, 0, 0, 0.2], [215, 168, 70, 0])
      .rotate(-8, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer({ resolveWithObject: true });
    output = await sharp(normalized.data)
      .composite([{
        input: mark.data,
        left: Math.max(0, Math.round((width - mark.info.width) / 2)),
        top: Math.max(0, Math.min(height - mark.info.height, Math.round(height * 0.63 - mark.info.height / 2)))
      }])
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
  }

  return new Response(new Uint8Array(output), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `inline; filename="${handle}-${position}.webp"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function watermarkLogo(url: URL) {
  watermarkLogoPromise ??= fetch(url, { next: { revalidate: 86400 } }).then(async (response) => {
    if (!response.ok) throw new Error(`Watermark logo unavailable (${response.status})`);
    return Buffer.from(await response.arrayBuffer());
  });
  return watermarkLogoPromise;
}
