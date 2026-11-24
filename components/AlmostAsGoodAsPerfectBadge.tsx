import { ALMOST_AS_GOOD_AS_PERFECT_LABEL, isAlmostAsGoodAsPerfect } from "@/lib/catalog/almostAsGoodAsPerfect";

export function AlmostAsGoodAsPerfectBadge({
  product,
  className = ""
}: {
  product: { tags?: string[] };
  className?: string;
}) {
  if (!isAlmostAsGoodAsPerfect(product)) return null;
  return (
    <span
      className={`inline-flex rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-sm font-semibold text-gold-200 ${className}`.trim()}
    >
      {ALMOST_AS_GOOD_AS_PERFECT_LABEL}
    </span>
  );
}
