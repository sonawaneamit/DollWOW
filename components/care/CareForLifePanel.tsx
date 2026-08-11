import { Check } from "lucide-react";
import { Care365Seal } from "@/components/care/Care365Seal";
import { careForLife } from "@/lib/care/careForLife";

export function CareForLifePanel({ title = "Care for the build. Support for ownership.", compact = false }: { title?: string; compact?: boolean }) {
  return (
    <section className="care-for-life-panel" aria-labelledby="care-for-life-title">
      <div>
        <p className="alive-eyebrow"><span /> DollWOW Care for Life</p>
        <h2 id="care-for-life-title">{title}</h2>
        <p>{careForLife.promise}</p>
        <Care365Seal compact={compact} />
      </div>
      <ul>
        {careForLife.commitments.slice(0, compact ? 4 : undefined).map((item) => (
          <li key={item.name}><Check aria-hidden="true" /><span><strong>{item.name}</strong>{compact ? null : <small>{item.summary}</small>}</span></li>
        ))}
      </ul>
    </section>
  );
}
