const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^\[?::1\]?$/i
];

export function validatePublicHttpUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false as const, reason: "Enter a full product URL, including https://." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false as const, reason: "Only public http or https links can be checked." };
  }

  if (privateHostPatterns.some((pattern) => pattern.test(parsed.hostname))) {
    return { ok: false as const, reason: "Private or local network links cannot be checked." };
  }

  return { ok: true as const, url: parsed };
}
