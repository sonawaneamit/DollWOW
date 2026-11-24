import type { Product } from "@/types/product";
import { almostAsGoodAsPerfectNote, isAlmostAsGoodAsPerfect } from "@/lib/catalog/almostAsGoodAsPerfect";

export function AlmostAsGoodAsPerfectNote({ product }: { product: Product }) {
  const note = almostAsGoodAsPerfectNote(product);
  if (!isAlmostAsGoodAsPerfect(product) || !note) return null;
  return (
    <aside
      role="note"
      aria-label="Almost as good as perfect details"
      className="mt-5 rounded-md border border-gold-500/30 bg-gold-500/10 p-4 text-base leading-7 text-ivory-100"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-gold-200">Almost as Good as Perfect</p>
      <p className="mt-2">{note}</p>
    </aside>
  );
}
