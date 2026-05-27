import Link from "next/link";

const filters = [
  { label: "All", href: "/shop" },
  { label: "Ready to ship", href: "/shop/ready-to-ship" },
  { label: "Custom", href: "/shop/custom" },
  { label: "Premium", href: "/shop/premium" },
  { label: "Lighter", href: "/shop/lighter" }
];

export function ProductFilters() {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Link
          key={filter.href}
          href={filter.href}
          className="rounded-full border border-gold-500/22 bg-ink-800/70 px-4 py-2 text-sm text-ivory-200 hover:border-gold-300"
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
