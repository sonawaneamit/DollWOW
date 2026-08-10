import sharp from "sharp";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { productImageSources } from "@/lib/catalog/productImage";

export const runtime = "nodejs";

const MAX_SOURCE_BYTES = 30 * 1024 * 1024;
const GOLD = "#d7a846";

export async function GET(request: Request, { params }: { params: Promise<{ handle: string; position: string }> }) {
  const { handle, position: rawPosition } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,180}$/i.test(handle)) return new Response("Invalid product", { status: 400 });
  const position = Number.parseInt(rawPosition, 10);
  if (!Number.isInteger(position) || position < 0 || position > 100) return new Response("Invalid image", { status: 400 });
  const requestedSize = new URL(request.url).searchParams.get("size");
  const bounds = requestedSize === "thumb"
    ? { width: 240, height: 320 }
    : requestedSize === "card"
      ? { width: 720, height: 960 }
      : { width: 1800, height: 2400 };

  const product = await getProductByHandle(handle, { cache: "force-cache", revalidate: 3600 });
  const source = product ? productImageSources(product)[position] : null;
  if (!source?.url) return new Response("Image not found", { status: 404 });

  const upstream = await fetch(source.url, { next: { revalidate: 86400 } });
  if (!upstream.ok) return new Response("Image unavailable", { status: 502 });
  const declaredLength = Number(upstream.headers.get("content-length") || 0);
  if (declaredLength > MAX_SOURCE_BYTES) return new Response("Image too large", { status: 413 });
  const input = Buffer.from(await upstream.arrayBuffer());
  if (input.byteLength > MAX_SOURCE_BYTES) return new Response("Image too large", { status: 413 });

  const normalized = await sharp(input)
    .rotate()
    .resize({ ...bounds, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  const width = normalized.info.width;
  const height = normalized.info.height;
  const fontSize = Math.max(28, Math.round(width * 0.073));
  const letterSpacing = Math.max(5, Math.round(fontSize * 0.2));
  const watermark = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.62"/>
        </filter>
      </defs>
      <g transform="translate(${Math.round(width * 0.5)} ${Math.round(height * 0.63)}) rotate(-8)" opacity="0.22" filter="url(#shadow)">
        <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" fill="${GOLD}" stroke="#1a100c" stroke-opacity="0.42" stroke-width="2" paint-order="stroke" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="${letterSpacing}">DOLLWOW</text>
      </g>
    </svg>`);
  const shouldWatermark = requestedSize !== "thumb" && requestedSize !== "card";
  const output = shouldWatermark
    ? await sharp(normalized.data).composite([{ input: watermark, top: 0, left: 0 }]).webp({ quality: 86, effort: 4 }).toBuffer()
    : normalized.data;

  return new Response(new Uint8Array(output), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Disposition": `inline; filename="${handle}-${position}.webp"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
