export function unbrandedSeoTitle(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim()
    .replace(/(?:\s*\|\s*dollwow!?)+\s*$/i, "").trim();
}

export function brandedSeoTitle(value) {
  const title = unbrandedSeoTitle(value);
  return title ? `${title} | DollWow` : "DollWow";
}

// Select whole sentences, not a character slice through product facts or decimals.
export function conciseSeoDescription(value, fallback = "", max = 158) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  const sentences = Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(text), (part) => part.segment.trim());
  const complete = sentences.filter((sentence) => /[.!?]["')\]]?$/.test(sentence));
  if (!complete.length) return text.length < 150 ? text : fallback;
  let result = complete[0];
  for (const sentence of complete.slice(1)) {
    if (result.length + sentence.length + 1 > max) break;
    result += ` ${sentence}`;
  }
  return result;
}
