import "server-only";
import references from "@/content/references/bodies.json";

export type BodyReference = {
  slug: string;
  title: string;
  designation: string;
  material: string;
  example: string;
  bodyOnlyKg: number;
  sourceCheckedAt: string;
  answer: string;
  identityNote: string;
  sourceTitle: string;
  sourceUrl: string;
  measurements: { label: string; cm: number }[];
};

export function getBodyReferencePreviews(environment = process.env.VERCEL_ENV): readonly BodyReference[] {
  return environment === "preview" ? references : [];
}

export function getBodyReferencePreview(slug: string, environment = process.env.VERCEL_ENV): BodyReference | null {
  return getBodyReferencePreviews(environment).find(reference => reference.slug === slug) ?? null;
}

export function referenceInches(cm: number): string {
  return (cm / 2.54).toFixed(1);
}

export function referencePounds(kg: number): string {
  return (kg / 0.45359237).toFixed(1);
}
