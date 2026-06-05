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
    <header className="sticky top-0 z-40 border-b border-[#d59a6f]/24 bg-[#160c0a]/95 text-[#f6e9dd] shadow-[0_18px_54px_rgba(20,6,4,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-ivory-50">
          Doll<span className="text-gold-400">Wow</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-[#e8d0c1] lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-2 hover:bg-[#f6e9dd]/[0.07] hover:text-[#f6e9dd]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-[#f1d2cb]">
          <Link href="/shop" className="rounded-full border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]" aria-label="Search products">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/support" className="rounded-full border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]" aria-label="Get help">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="rounded-full border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm text-[#e8d0c1] lg:hidden">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="shrink-0 rounded-full border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.035] px-3 py-2">
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
