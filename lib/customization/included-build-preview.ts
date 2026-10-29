export function includedBuildPreviewEnabled(env: Record<string, string | undefined> = process.env) {
  return env.DOL314_INCLUDED_BUILD_PREVIEW === "1" &&
    (env.VERCEL_ENV === "preview" || (env.NODE_ENV === "development" && env.NEXT_PUBLIC_VERCEL_ENV === "preview"));
}
