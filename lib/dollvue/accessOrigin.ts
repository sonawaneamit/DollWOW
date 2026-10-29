export function dollVueAccessOrigin(requestUrl: string, canonicalUrl: string, environment?: string, deploymentHost?: string) {
  const request = new URL(requestUrl);
  if (environment === "preview" && deploymentHost && request.protocol === "https:" && request.host === deploymentHost) return request.origin;
  return new URL(canonicalUrl).origin;
}
