import "server-only";
import references from "@/content/references/heads.json";

export type HeadReference = {
  slug: string;
  brand: string;
  code: string;
  designation?: string;
  title: string;
  body: string;
  example: string;
  sourceCheckedAt: string;
  answer: string;
  detail: string;
  boundary: string;
  sourceTitle: string;
  sourceUrl: string;
};

export function getHeadReferencePreviews(environment = process.env.VERCEL_ENV): readonly HeadReference[] {
  return environment === "preview" ? references : [];
}

export function getHeadReferencePreview(slug: string, environment = process.env.VERCEL_ENV): HeadReference | null {
  return getHeadReferencePreviews(environment).find(reference => reference.slug === slug) ?? null;
}
