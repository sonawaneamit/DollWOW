import type { ReactNode } from "react";
import { CollectionDisclosure } from "@/components/CollectionDisclosure";

export function usesCompactBrandLayout(brand: string, deployment = process.env.VERCEL_ENV) {
  if (["irontech", "wm", "sedoll", "starpery"].includes(brand)) return true;
  // DOL-229's next batch remains review-only until Martin approves its release.
  return deployment === "preview" && ["dolls-castle", "moonvale", "tantaly", "erovenus", "climax", "il-doll", "angelkiss", "real-lady"].includes(brand);
}

export function BrandHubSection({ compact, id, title, eyebrow, comparison = false, children }: {
  compact: boolean;
  id: string;
  title: string;
  eyebrow?: string;
  comparison?: boolean;
  children: ReactNode;
}) {
  if (compact) return <CollectionDisclosure id={id} title={title} eyebrow={eyebrow}>{children}</CollectionDisclosure>;

  const heading = <>
    {eyebrow ? <p className="text-sm  text-gold-300">{eyebrow}</p> : null}
    <h2 id={id} className={`${eyebrow ? "mt-2 " : ""}text-2xl font-semibold text-ivory-50`}>{title}</h2>
  </>;
  return (
    <section className={comparison ? "mb-8 overflow-hidden rounded-[8px] border border-gold-500/14 bg-ink-900/64" : "mt-10 border-t border-gold-500/12 pt-8"} aria-labelledby={id}>
      {comparison ? <div className="border-b border-gold-500/12 p-5">{heading}</div> : eyebrow ? <div className="max-w-3xl">{heading}</div> : heading}
      {children}
    </section>
  );
}
