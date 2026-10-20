import Link from "next/link";

const labels = [
  ["TPE: material family", "Compare the exact manufacturer's formulation and body, not the label alone."],
  ["SE STPE: branded range", "SE's STPE bodies sit within its TPE range; the name is not a universal specification shared by every brand."],
  ["SE LSTPE: construction option", "A lightweight internal option for supported SE STPE bodies, not a new outer material. Check the body-specific support and weight."]
] as const;

export function TpeMaterialLabels() {
  return (
    <div className="mt-6 max-w-3xl" data-tpe-material-labels>
      <h3 className="text-xl font-semibold text-ivory-50">Understand the labels before comparing builds</h3>
      <p className="mt-3 text-sm leading-6 text-ivory-400">
        These labels describe different things: a material family, a brand&apos;s range and a construction option. They are not three equivalent materials.
      </p>
      <dl className="mt-4 divide-y divide-gold-500/12">
        {labels.map(([label, description]) => (
          <div key={label} className="py-3 first:pt-0">
            <dt className="text-base font-semibold text-ivory-100">{label}</dt>
            <dd className="mt-1 text-sm leading-6 text-ivory-400">{description}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm leading-6 text-ivory-400">
        The body, head and available options still define the build you are buying. This collection keeps silicone-head hybrids separate; the SE guide explains supported LSTPE bodies and their published weight differences.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-gold-300">
        <a href="#collection-products" className="underline underline-offset-4">Browse full-TPE builds</a>
        <Link href="/learn/se-doll-lstpe-lightweight-upgrade" className="underline underline-offset-4">See SE body support and weight comparisons</Link>
      </div>
      <p className="mt-4 text-sm leading-6 text-ivory-400">
        Source: <a href="https://www.sedoll.com/stpe-series-introduces-a-new-custom-option-lstpe-lightweight-upgrade/" className="underline underline-offset-4">SE&apos;s LSTPE construction explanation</a>.
      </p>
    </div>
  );
}
