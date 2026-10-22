import React from "react";
import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { GuideLinkRow, revealFocusedGuide } from "@/components/GuideLinkRow";

function row(scrollLeft = 0) {
  return { scrollLeft, getBoundingClientRect: () => ({ left: 16, right: 304 }), scrollTo: vi.fn() };
}
function link(left: number, right: number) {
  return { getBoundingClientRect: () => ({ left, right } as DOMRect) };
}

describe("guide row focus visibility", () => {
  it("reveals a clipped right edge without scrolling the page or changing vertical position", () => {
    const container = row();
    revealFocusedGuide(container, link(252, 429));
    expect(container.scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 125, behavior: "instant" });
  });

  it("reveals a clipped left edge from an already scrolled row", () => {
    const container = row(200);
    revealFocusedGuide(container, link(-20, 100));
    expect(container.scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 164, behavior: "instant" });
  });

  it("does not scroll links already fully visible, including exact edges", () => {
    const container = row(100);
    revealFocusedGuide(container, link(16, 304));
    revealFocusedGuide(container, link(40, 240));
    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it("never requests a negative horizontal position", () => {
    const container = row();
    revealFocusedGuide(container, link(-20, 100));
    expect(container.scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 0, behavior: "instant" });
  });

  it("keeps markup, links and styling identical when the preview behavior is enabled", () => {
    const props = { label: "Buying guides", className: "collection-guide-links mb-6 flex flex-wrap gap-3", tabIndex: 0, children: <Link href="/learn/sex-doll-cost">Cost guide</Link> };
    expect(renderToStaticMarkup(<GuideLinkRow {...props} previewFocusScrolling />)).toBe(renderToStaticMarkup(<GuideLinkRow {...props} />));
    expect(GuideLinkRow(props).props.onFocusCapture).toBeUndefined();
    expect(GuideLinkRow({ ...props, previewFocusScrolling: true }).props.onFocusCapture).toBeTypeOf("function");
  });
});
