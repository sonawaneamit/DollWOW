export function gynoidReleasePreviewEnabled() {
  const environment = process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV;
  return environment === 'preview' && process.env.NEXT_PUBLIC_DOL273_RELEASE_PREVIEW === '1';
}
