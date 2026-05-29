import Link from "next/link";
import { HelpCircle, Search, ShoppingBag } from "lucide-react";

const links = [
  ["Shop Dolls", "/shop"],
  ["Help Me Choose", "/help-me-choose"],
  ["Compare", "/compare"],
  ["Warehouse", "/warehouse"],
  ["Customize", "/customize"],
  ["About Us", "/why-dollwow"]
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold-500/20 bg-ink-900/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-ivory-50">
          Doll<span className="text-gold-400">Wow</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-ivory-400 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-2 hover:bg-ivory-50/[0.045] hover:text-ivory-50">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-ivory-300">
          <Link href="/shop" className="rounded-full border border-gold-500/20 bg-ivory-50/[0.035] p-2 hover:border-gold-300/50 hover:text-ivory-50" aria-label="Search products">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/support" className="rounded-full border border-gold-500/20 bg-ivory-50/[0.035] p-2 hover:border-gold-300/50 hover:text-ivory-50" aria-label="Get help">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="rounded-full border border-gold-500/20 bg-ivory-50/[0.035] p-2 hover:border-gold-300/50 hover:text-ivory-50" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm text-ivory-400 lg:hidden">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="shrink-0 rounded-full border border-gold-500/16 px-3 py-2">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
