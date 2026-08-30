import { CalendarDays, Check, Gift } from "lucide-react";
import { SE_SEPTEMBER_PROMOTION, type SeSeptemberPdpPromotion } from "@/lib/promotions/seSeptember2026";

export function SeSeptemberBonusBlock({ promotion }: { promotion: SeSeptemberPdpPromotion }) {
  const frees = promotion.includesSoftBelly
    ? [...promotion.frees, SE_SEPTEMBER_PROMOTION.siliconeProSoftBelly]
    : promotion.frees;

  return (
    <aside className="mt-5 overflow-hidden rounded-[14px] border border-gold-500/28 bg-gold-500/[0.07]" aria-labelledby="se-september-bonuses-heading">
      <div className="flex items-start gap-3 border-b border-gold-500/18 px-4 py-4">
        <span className="rounded-full bg-gold-500/14 p-2 text-gold-300" aria-hidden="true">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gold-300">
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> {promotion.displayDates}
          </p>
          <h2 id="se-september-bonuses-heading" className="mt-1 text-xl font-semibold text-ivory-50">
            September {promotion.material} factory bonuses
          </h2>
          <p className="mt-1 text-sm leading-6 text-ivory-300">Included free with this eligible custom SE Doll order.</p>
        </div>
      </div>
      <ul className="grid gap-x-5 gap-y-2 px-4 py-4 text-sm text-ivory-200 sm:grid-cols-2">
        {frees.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
            <span>Free {item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

