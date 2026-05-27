import { CheckCircle2 } from "lucide-react";
import type { Product } from "@/types/product";

export function DollDetailsCard({ product }: { product: Product }) {
  const details = [
    ["Brand", product.extended.brand ?? product.vendor],
    ["Material", product.extended.material ?? "Confirm before checkout"],
    ["Height", product.extended.heightCm ? `${product.extended.heightCm} cm` : "Confirm before checkout"],
    ["Weight", product.extended.weightLb ? `${product.extended.weightLb} lb` : "Confirm before checkout"],
    ["Delivery", product.extended.deliveryEstimate ?? "We verify before checkout"],
    ["Warehouse", product.extended.warehouseCountry ?? "Confirm before checkout"]
  ];

  return (
    <section className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6">
      <div className="mb-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-gold-400" />
        <div>
          <h2 className="text-xl font-semibold text-ivory-50">Doll details card</h2>
          <p className="text-sm text-ivory-400">A clear product record and care summary.</p>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-[14px] bg-ink-950/45 p-4">
            <dt className="text-xs uppercase tracking-[0.14em] text-ivory-600">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-ivory-100">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-ivory-400">{product.extended.qcNote ?? "We confirm final details before checkout or production."}</p>
    </section>
  );
}
