import { Check } from "lucide-react";

export function IncludedBuildSummary({ items }: { items: Array<{ id: string; label: string }> }) {
  if (!items.length) return null;
  return (
    <section className="mb-6 border-y border-border py-4" aria-labelledby="included-build-heading">
      <h3 id="included-build-heading" className="text-base font-semibold">Included in this build</h3>
      <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 items-start gap-2 text-sm leading-6">
            <Check className="mt-1 h-4 w-4 shrink-0 text-stock" aria-hidden="true" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
