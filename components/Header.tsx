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
    <header className="sticky top-0 z-40 border-b border-gold-500/12 bg-ink-950/86 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-ivory-50">
          Doll<span className="text-gold-400">Wow</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-ivory-400 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-gold-300">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-ivory-300">
          <Link href="/shop" className="rounded-full p-2 hover:bg-ink-800" aria-label="Search products">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/support" className="rounded-full p-2 hover:bg-ink-800" aria-label="Get help">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="rounded-full p-2 hover:bg-ink-800" aria-label="Cart">
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
