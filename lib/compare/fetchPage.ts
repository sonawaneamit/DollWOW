import { validatePublicHttpUrl } from "./urlSafety";

export async function fetchPublicPage(rawUrl: string) {
  const validation = validatePublicHttpUrl(rawUrl);
  if (!validation.ok) throw new Error(validation.reason);

  const response = await fetch(validation.url.toString(), {
    headers: {
      "user-agent": "DollWow price comparison bot; contact support@dollwow.com"
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(9000)
  });

  if (!response.ok) throw new Error("We could not read that page automatically.");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error("That link did not return a product page.");
  return response.text();
}
