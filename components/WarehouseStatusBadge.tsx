import type { ProductExtended } from "@/types/product";

const labels: Record<NonNullable<ProductExtended["stockStatus"]>, string> = {
  ready_to_ship: "Ready to ship",
  custom: "Custom order",
  check_stock: "Check stock"
};

export function WarehouseStatusBadge({ status }: { status?: ProductExtended["stockStatus"] }) {
  const value = status ?? "check_stock";
  return (
    <span className="inline-flex rounded-full border border-gold-500/20 bg-ink-950/50 px-3 py-1 text-xs font-semibold text-ivory-200">
      <span className={value === "ready_to_ship" ? "text-stock" : "text-gold-300"}>{labels[value]}</span>
    </span>
  );
}
