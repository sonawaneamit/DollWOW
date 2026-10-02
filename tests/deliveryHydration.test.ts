import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { ProductBuyActions } from "@/components/ProductBuyActions";

const state = vi.hoisted(() => ({ mounted: false }));
vi.mock("@/lib/utils/storageStore", () => ({ useMounted: () => state.mounted }));
vi.mock("@/components/cart/CartProvider", () => ({ useCart: () => ({ addItem: vi.fn() }) }));

const props = {
  merchandiseId: "test", productTitle: "Test doll", productHandle: "test",
  productImage: null, unitPrice: 1000, currencyCode: "USD", readyToShip: false,
  stockStatus: "custom" as const
};

afterEach(() => { state.mounted = false; vi.useRealTimers(); });

it("does not calculate a browser-local delivery date during server render or hydration", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T23:40:00Z"));
  expect(renderToStaticMarkup(createElement(ProductBuyActions, props))).not.toContain("Est. delivery");
});

it("shows the delivery estimate after mounting without changing purchase controls", () => {
  state.mounted = true;
  const html = renderToStaticMarkup(createElement(ProductBuyActions, props));
  expect(html).toContain("Est. delivery");
  expect(html).toContain("Customize your doll");
});
