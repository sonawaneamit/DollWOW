import { expect, test, vi } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections } from "@/lib/customization/resolve";
import { withPromotionOptionPricing } from "@/lib/promotions/optionPricing";
vi.mock("server-only", () => ({}));

test.skipIf(process.env.DOLLWOW_WM_LIVE !== "1")("verifies WM breathing in an actual Shopify cart without an order", async () => {
  Object.assign(process.env, parseEnv(await readFile(".env.local", "utf8")));
  const { getProductByHandle } = await import("@/lib/shopify/storefront");
  const product = await getProductByHandle("wm-anae-156cm-h-cup-tpe-companion-doll-17j0e");
  expect(product).toBeTruthy();
  const config = withPromotionOptionPricing(product!, getCustomizationConfig(product!));
  const group = config.groups.find(g => g.options.some(o => o.id === "breathing-system"));
  expect(group).toBeTruthy();
  expect(group!.options.find(o => o.id === "breathing-system")!.priceDelta).toBe(0);
  const selections = { ...getDefaultSelections(config), [group!.id]: group!.selectionMode === "multiple" ? ["breathing-system"] : "breathing-system" };
  await writeFile("/tmp/wm-october-cart-input.json", JSON.stringify({ lines: [{ merchandiseId: product!.variants[0].id, quantity: 1, selections }] }));
  const response = await fetch(`${process.env.DOLLWOW_PROBE_ORIGIN ?? "http://localhost:3230"}/api/cart/checkout`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: [{ merchandiseId: product!.variants[0].id, quantity: 1, selections }] })
  });
  const checkout = await response.json();
  expect(response.status, JSON.stringify(checkout)).toBe(200);
  const readback = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, "")}/api/2026-04/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN! },
    body: JSON.stringify({ query: `query($id:ID!){cart(id:$id){lines(first:20){nodes{attributes{key value}merchandise{...on ProductVariant{id price{amount currencyCode}}}}}}}`, variables: { id: checkout.id } })
  });
  const result = await readback.json();
  expect(result.errors).toBeUndefined();
  const lines = result.data.cart.lines.nodes;
  expect(lines).toHaveLength(1);
  expect(lines[0].attributes.some((a: {value:string}) => a.value.includes("Breathing System"))).toBe(true);
  expect(lines[0].merchandise.price.amount).toBe(product!.variants[0].price.amount);
  const evidence = { status: "PASS", handle: product!.handle, base: product!.variants[0].price, breathing: 0, lines, checkoutUrl: checkout.checkoutUrl, noOrderPlaced: true };
  await writeFile("/tmp/wm-october-live-cart.json", JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ status: "PASS", breathing: 0, lines: lines.length, checkoutUrl: checkout.checkoutUrl }));
}, 180000);
