import React, { type EffectCallback, type ReactElement, type ReactNode } from "react";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeAlive } from "@/components/HomeAlive";
import { sampleProducts } from "@/lib/data/sample-products";
import { getHomepageReviews } from "@/lib/reviews/reviews";

const hooks = vi.hoisted(() => ({
  values: [] as unknown[],
  setters: [] as ReturnType<typeof vi.fn>[],
  effects: [] as EffectCallback[],
  index: 0
}));

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useMemo: (calculate: () => unknown) => calculate(),
  useEffect: (effect: EffectCallback) => { hooks.effects.push(effect); },
  useState: (initial: unknown) => {
    const index = hooks.index++;
    return [hooks.values[index] ?? initial, hooks.setters[index]];
  }
}));

const handles = [
  "irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli",
  "starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg",
  "hr-dolls-zeki-165cm-e-cup-silicone-companion-doll-1imsn"
];
const products = handles.map((handle, index) => ({
  ...sampleProducts[0], id: `spot-${index}`, handle,
  title: `Example ${index}`, vendor: "WM Dolls", extended: { brand: "WM Dolls" }
}));

function render(paused = false, reducedMotion = false, catalog = products) {
  hooks.values = [0, paused, reducedMotion];
  hooks.index = 0;
  hooks.effects = [];
  hooks.setters = [vi.fn(), vi.fn(), vi.fn()];
  return HomeAlive({ products: catalog, customerReviews: getHomepageReviews() });
}

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!React.isValidElement<{ children?: ReactNode }>(node)) return [];
  return [node as ReactElement<Record<string, unknown>>, ...React.Children.toArray(node.props.children).flatMap(elements)];
}

describe("homepage spotlight rotation", () => {
  let preference: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("window", { matchMedia: () => preference, setInterval, clearInterval });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("advances once per6500ms and clears the owned timer", () => {
    render();
    const cleanup = hooks.effects.at(-1)!();
    vi.advanceTimersByTime(6499);
    expect(hooks.setters[0]).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    const advance = hooks.setters[0].mock.calls[0][0] as (value: number) => number;
    expect(advance(0)).toBe(1);
    expect(advance(2)).toBe(0);
    if (typeof cleanup === "function") cleanup();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([[true, false], [false, true]])("does not register a timer when paused=%s/reduced=%s", (paused, reduced) => {
    render(paused, reduced);
    hooks.effects.at(-1)!();
    vi.advanceTimersByTime(26000);
    expect(vi.getTimerCount()).toBe(0);
    expect(hooks.setters[0]).not.toHaveBeenCalled();
  });

  it("respects reduced motion before the preference state update commits", () => {
    preference.matches = true;
    render();
    hooks.effects.at(-1)!();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, 1])("does not offer rotation for%s spotlight products", (count) => {
    const tree = elements(render(false, false, products.slice(0, count)));
    expect(tree.some(node => node.props["aria-label"] === "Pause spotlight rotation")).toBe(false);
    hooks.effects.at(-1)!();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("manual thumbnail selection pauses and selects without modifying product links", () => {
    const tree = elements(render());
    const thumbnails = tree.filter(node => node.type === "button" && String(node.props["aria-label"]).startsWith("Show "));
    expect(thumbnails).toHaveLength(3);
    expect(thumbnails.map(node => node.props["aria-pressed"])).toEqual([true, false, false]);
    (thumbnails[2].props.onClick as () => void)();
    expect(hooks.setters[1]).toHaveBeenCalledWith(true);
    expect(hooks.setters[0]).toHaveBeenCalledWith(2);
    expect(tree.some(node => node.props.href === `/products/${handles[0]}`)).toBe(true);
  });

  it.each([false, true])("exposes the rotation toggle and next action when paused=%s", (paused) => {
    const control = elements(render(paused)).find(node => node.props["aria-label"] === `${paused ? "Resume" : "Pause"} spotlight rotation`)!;
    expect(control.props["aria-pressed"]).toBe(paused);
    expect(control.props.disabled).toBe(false);
    expect(control.props.title).toBe(control.props["aria-label"]);
    (control.props.onClick as () => void)();
    const toggle = hooks.setters[1].mock.calls[0][0] as (value: boolean) => boolean;
    expect(toggle(paused)).toBe(!paused);
  });

  it("keeps the rotation control outside the horizontally scrolling thumbnail rail", () => {
    const tree = elements(render());
    const wrapper = tree.find(node => node.props.className === "home-spot__controls")!;
    const rail = tree.find(node => node.props["aria-label"] === "Featured dolls")!;
    expect(elements(wrapper).some(node => node.props["aria-label"] === "Pause spotlight rotation")).toBe(true);
    expect(elements(rail).some(node => node.props["aria-label"] === "Pause spotlight rotation")).toBe(false);
  });

  it("uses theme foreground/surface tokens for the independent icon", () => {
    const declarations = new Map<string, string>();
    postcss.parse(readFileSync("app/globals.css", "utf8")).walkRules(".home-spot__rotation", rule => {
      rule.walkDecls(declaration => { declarations.set(declaration.prop, declaration.value); });
    });
    expect(declarations.get("color")).toBe("rgb(var(--color-text))");
    expect(declarations.get("background")).toBe("rgb(var(--color-surface))");
  });

  it("disables the resume control for reduced motion and cleans up its preference listener", () => {
    const control = elements(render(false, true)).find(node => node.props["aria-label"] === "Spotlight rotation disabled by reduced motion")!;
    expect(control.props.disabled).toBe(true);
    expect(control.props["aria-pressed"]).toBe(true);
    const cleanup = hooks.effects[1]();
    const update = preference.addEventListener.mock.calls[0][1] as () => void;
    preference.matches = true;
    update();
    expect(hooks.setters[2]).toHaveBeenLastCalledWith(true);
    if (typeof cleanup === "function") cleanup();
    expect(preference.removeEventListener).toHaveBeenCalledWith("change", update);
  });
});
