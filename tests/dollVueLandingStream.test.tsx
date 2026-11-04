import React, { use } from "react";
import { PassThrough } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ catalog: vi.fn(), eligible: vi.fn(), pending: null as Promise<React.ReactNode> | null }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/shopify/storefront", () => ({ getSeoCatalogProducts: state.catalog }));
vi.mock("@/lib/dollvue/config", () => ({ isDollVueCatalogProduct: state.eligible }));
vi.mock("@/components/ProductCard", () => ({ ProductCard: ({ product, priority }: { product: { id: string }; priority: boolean }) => <span data-priority={priority}>{product.id}</span> }));
vi.mock("@/components/dollvue/DollVueLanding", () => ({ DollVueLanding: ({ arrivals }: { arrivals: React.ReactNode }) => <main><h1>DollVue hero</h1><div>{arrivals}</div></main> }));
vi.mock("@/components/dollvue/DollVueArrivals", async (original) => {
  const actual = await original<typeof import("@/components/dollvue/DollVueArrivals")>();
  return { ...actual, DollVueArrivals: () => state.pending ? use(state.pending) : null };
});

import Page from "@/app/dollvue/page";

beforeEach(() => { vi.clearAllMocks(); state.pending = null; });

it("streams the hero while arrivals are still pending", async () => {
  let release!: (value: React.ReactNode) => void;
  state.pending = new Promise((resolve) => { release = resolve; });
  const output = new PassThrough();
  let html = "";
  output.on("data", (chunk) => { html += chunk.toString(); });
  const complete = new Promise<void>((resolve) => output.on("end", resolve));
  await new Promise<void>((resolve, reject) => {
    const stream = renderToPipeableStream(<Page />, {
      onShellReady() { stream.pipe(output); resolve(); },
      onError: reject
    });
  });
  expect(html).toContain("DollVue hero");
  expect(html).not.toContain("Resolved arrivals");
  release(<span>Resolved arrivals</span>);
  await complete;
  expect(html).toContain("Resolved arrivals");
});

it("keeps the same query, eligibility, order, nine-card limit, and priorities", async () => {
  const actual = await vi.importActual<typeof import("@/components/dollvue/DollVueArrivals")>("@/components/dollvue/DollVueArrivals");
  const products = Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, extended: { sourceReleaseRank: i } }));
  state.catalog.mockResolvedValue(products);
  state.eligible.mockImplementation((p: { id: string }) => p.id !== "p11");
  const result = await actual.DollVueArrivals();
  expect(state.catalog).toHaveBeenCalledWith({ first: 5000, strict: true, includeDollVueEligibility: true });
  expect(result.map((row) => row.key)).toEqual(["p10", "p9", "p8", "p7", "p6", "p5", "p4", "p3", "p2"]);
  const html = renderToStaticMarkup(<>{result}</>);
  expect(html.match(/data-priority="true"/g)).toHaveLength(3);
  expect(products[0].id).toBe("p0");
});

it("keeps catalog failures as failures", async () => {
  const actual = await vi.importActual<typeof import("@/components/dollvue/DollVueArrivals")>("@/components/dollvue/DollVueArrivals");
  state.catalog.mockRejectedValue(new Error("Catalog unavailable"));
  await expect(actual.DollVueArrivals()).rejects.toThrow("Catalog unavailable");
});
