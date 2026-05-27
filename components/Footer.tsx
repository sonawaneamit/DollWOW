import Link from "next/link";

const footerLinks = [
  ["Shipping", "/shipping"],
  ["Returns", "/returns"],
  ["Adult-only policy", "/adult-only"],
  ["Support", "/support"],
  ["Supplier page", "/supplier"]
];

export function Footer() {
  return (
    <footer className="border-t border-gold-500/12 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <p className="text-2xl font-bold text-ivory-50">
            Doll<span className="text-gold-400">Wow</span>
          </p>
          <p className="mt-3 max-w-xl text-sm text-ivory-500">
            A simpler way to find, compare, customize, and buy the right doll with clear support.
          </p>
          <p className="mt-4 text-xs text-ivory-600">Adults only. Product details, prices, and stock are verified before checkout.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-ivory-400">
          {footerLinks.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-gold-300">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
