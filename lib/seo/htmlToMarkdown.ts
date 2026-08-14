import { NodeHtmlMarkdown } from "node-html-markdown";
import { parse } from "node-html-parser";

export function publicMainHtmlToMarkdown(html: string, canonicalUrl: string) {
  const root = parse(html);
  const main = root.querySelector("main#main-content") ?? root.querySelector("main");
  if (!main) return null;

  for (const selector of ["script", "style", "noscript", "svg", "button", "input", "select", "textarea", "dialog", "[aria-hidden=true]"]) {
    for (const node of main.querySelectorAll(selector)) node.remove();
  }

  for (const image of main.querySelectorAll("img")) {
    const source = image.getAttribute("src");
    if (!source?.startsWith("/_next/image")) continue;
    try {
      const optimizedUrl = new URL(source, canonicalUrl);
      const originalUrl = optimizedUrl.searchParams.get("url");
      if (originalUrl) image.setAttribute("src", new URL(originalUrl, canonicalUrl).toString());
    } catch {
      // Keep the source unchanged when it is not a valid URL.
    }
  }

  const title = root.querySelector("title")?.text.trim();
  const description = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim();
  const markdown = NodeHtmlMarkdown.translate(main.innerHTML, {
    bulletMarker: "-",
    codeBlockStyle: "fenced",
    keepDataImages: false,
    preferNativeParser: false,
    useInlineLinks: true
  }).replace(/\n{3,}/g, "\n\n").trim();

  if (!markdown) return null;

  return [
    title ? `<!-- ${title} -->` : "",
    description ? `> ${description}` : "",
    `Canonical: ${canonicalUrl}`,
    "",
    markdown,
    "",
    "---",
    "",
    "Current product, price, stock, shipping, and policy details must be confirmed on the canonical DollWow page."
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== "")).join("\n").trim();
}
