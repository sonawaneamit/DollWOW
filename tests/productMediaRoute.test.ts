import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/types/product";

const storefront = vi.hoisted(() => ({
  getProductByHandle: vi.fn()
}));

vi.mock("@/lib/shopify/storefront", () => storefront);

import { GET } from "@/app/product-media/[handle]/[position]/route";

describe("protected product media route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    storefront.getProductByHandle.mockReset();
  });

  it("serves the reported small Knox source image without a watermark 500", async () => {
    const handle = "wm-knox-head-n6-175cm-tpe-companion-doll-kf9md";
    const sourceUrl = "https://cdn.example.com/knox-small-source.webp";
    const smallSource = await sharp({
      create: { width: 150, height: 200, channels: 3, background: "#c9a27f" }
    }).webp().toBuffer();
    const logo = await sharp({
      create: { width: 768, height: 512, channels: 4, background: { r: 215, g: 168, b: 70, alpha: 1 } }
    }).png().toBuffer();

    storefront.getProductByHandle.mockResolvedValue({
      handle,
      featuredImage: null,
      images: Array.from({ length: 6 }, (_, position) => ({
        url: position === 5 ? sourceUrl : `https://cdn.example.com/knox-${position}.webp`,
        altText: null
      }))
    } as Product);

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      return url === sourceUrl
        ? new Response(new Uint8Array(smallSource), { status: 200, headers: { "content-type": "image/webp" } })
        : new Response(new Uint8Array(logo), { status: 200, headers: { "content-type": "image/png" } });
    }));

    const response = await GET(
      new Request(`https://dollwow.com/product-media/v4/${handle}/5`),
      { params: Promise.resolve({ handle, position: "5" }) }
    );
    const output = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(output).metadata();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(metadata.width).toBe(150);
    expect(metadata.height).toBe(200);
  });
});
