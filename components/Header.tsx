"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HelpCircle, Search, ShoppingBag, X } from "lucide-react";
import { catalogFilterOptions } from "@/lib/catalog/filters";
import { readBrowserCartState, type BrowserCartState } from "@/lib/cart/browser";

const primaryLinks = [
  ["Help Me Choose", "/help-me-choose"],
  ["Price Match", "/compare"],
  ["Warehouse", "/warehouse"],
  ["Customize", "/customize"],
  ["About Us", "/why-dollwow"]
] as const;

const featuredShopLinks = [
  { label: "Ready to ship", href: "/warehouse" },
  { label: "Factory order", href: "/customize" },
  { label: "Compare a listing", href: "/compare" },
  { label: "Help me choose", href: "/help-me-choose" }
];

const policyLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Buyer protection", href: "/buyer-protection" },
  { label: "Shipping protection", href: "/shipping-protection" },
  { label: "How ordering works", href: "/how-ordering-works" },
  { label: "Returns", href: "/returns" },
  { label: "Shipping guide", href: "/shipping" },
  { label: "Scam alert", href: "/scam-alert" }
];

const quickSearchLinks = [
  { label: "WM Dolls", href: "/shop/wm-dolls" },
  { label: "Angelkiss", href: "/shop/angelkiss-dolls" },
  { label: "Irontech", href: "/shop/irontech-dolls" },
  { label: "Ready to ship", href: "/warehouse" },
  { label: "Silicone", href: "/shop/silicone" },
  { label: "170 cm+", href: "/shop/height-170-plus" }
];

const suggestedSearchRoutes = [
  { label: "Ready to ship", href: "/warehouse", keywords: ["ready", "warehouse", "ships", "tomorrow", "stock"] },
  { label: "Custom builds", href: "/customize", keywords: ["custom", "customize", "builder", "options"] },
  { label: "Male dolls", href: "/shop/male-dolls", keywords: ["male", "man", "men"] },
  { label: "Female dolls", href: "/shop/female-dolls", keywords: ["female", "woman", "women"] },
  { label: "Silicone dolls", href: "/shop/silicone", keywords: ["silicone"] },
  { label: "TPE dolls", href: "/shop/tpe", keywords: ["tpe"] }
];

const brandLinks = catalogFilterOptions.brands.map((brand) => ({
  label: brand.label,
  href: `/shop?brand=${brand.value}`
}));

const heightLinks = catalogFilterOptions.heights.map((height) => ({
  label: height.label,
  href: `/shop?height=${height.value}`
}));

const materialLinks = catalogFilterOptions.materials.map((material) => ({
  label: material.label,
  href: `/shop?material=${material.value}`
}));

const bodyTypeLinks = [
  { label: "Female dolls", href: "/shop/female-dolls" },
  { label: "Male dolls", href: "/shop/male-dolls" }
];

type SearchResultSuggestion = {
  score: number;
  id: string;
  handle: string;
  title: string;
  brand?: string;
  material?: string;
  heightCm?: number;
  stockStatus?: string;
  price?: { amount: string; currencyCode: string };
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartState, setCartState] = useState<BrowserCartState | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const shouldQueryRemote = searchOpen && searchQuery.trim().length >= 2;

  const activeCount = cartState?.totalQuantity ?? 0;
  const searchSuggestions = useMemo(() => buildSearchSuggestions(searchQuery), [searchQuery]);
  const activeMenuLabel = useMemo(() => {
    if (pathname?.startsWith("/warehouse")) return "Warehouse";
    if (pathname?.startsWith("/customize")) return "Customize";
    if (pathname?.startsWith("/compare")) return "Price Match";
    if (pathname?.startsWith("/help-me-choose")) return "Help Me Choose";
    if (pathname?.startsWith("/why-dollwow")) return "About Us";
    return "Shop Dolls";
  }, [pathname]);

  useEffect(() => {
    const sync = () => setCartState(readBrowserCartState());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("dollwow:cart-updated", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dollwow:cart-updated", sync as EventListener);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!shouldQueryRemote) return;
    const trimmed = searchQuery.trim();

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&limit=4`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const payload = (await response.json()) as { results?: SearchResultSuggestion[] };
        setSearchResults(payload.results || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchOpen, searchQuery, shouldQueryRemote]);

  function openSearch() {
    setMenuOpen(false);
    setSearchOpen(true);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(trimmed ? `/shop?query=${encodeURIComponent(trimmed)}` : "/shop");
    setSearchOpen(false);
  }

  function closeAll() {
    setMenuOpen(false);
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#d59a6f]/24 bg-[#160c0a]/88 text-[#f6e9dd] shadow-[0_18px_54px_rgba(20,6,4,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={closeAll} className="text-xl font-bold tracking-[-0.03em] text-ivory-50">
          Doll<span className="text-gold-400">Wow</span><span className="text-gold-400">.</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-[#e8d0c1] lg:flex">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className={`rounded-full px-3 py-2 transition hover:bg-[#f6e9dd]/[0.07] hover:text-[#f6e9dd] ${activeMenuLabel === "Shop Dolls" || menuOpen ? "bg-[#f6e9dd]/[0.07] text-[#f6e9dd]" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="shop-menu"
          >
            Shop Dolls
          </button>

          {primaryLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={closeAll}
              className={`rounded-full px-3 py-2 transition hover:bg-[#f6e9dd]/[0.07] hover:text-[#f6e9dd] ${activeMenuLabel === label ? "bg-[#f6e9dd]/[0.07] text-[#f6e9dd]" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-[#f1d2cb]">
          <button
            type="button"
            onClick={openSearch}
            className="rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link href="/support" onClick={closeAll} className="rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]" aria-label="Get help">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            onClick={closeAll}
            className="relative rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]"
            aria-label={activeCount ? "Saved checkout" : "Cart"}
            title={activeCount ? "Saved checkout" : "Cart"}
          >
            <ShoppingBag className="h-5 w-5" />
            {activeCount ? (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#f3cdb0] px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-[#1c1009]">
                {activeCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {menuOpen ? (
        <div id="shop-menu" className="hidden border-t border-[#d59a6f]/14 bg-[#100806]/96 px-4 py-4 shadow-[0_28px_80px_rgba(0,0,0,0.55)] lg:block">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[14px] border border-[#d59a6f]/24 bg-[linear-gradient(180deg,#1a110d,#100907)]">
            <div className="grid items-start gap-0 border-b border-[#d59a6f]/16 px-5 py-4 lg:grid-cols-4">
              <MegaColumn title="Brands" links={brandLinks.slice(0, 10)} cta={{ label: "All dolls", href: "/shop" }} onNavigate={closeAll} twoColumns />
              <MegaColumn title="Shop by height" links={heightLinks} onNavigate={closeAll} />
              <MegaColumn title="Materials" links={materialLinks} onNavigate={closeAll} />
              <MegaColumn title="Start here" links={[...bodyTypeLinks, ...featuredShopLinks]} onNavigate={closeAll} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#e8b48f]">Popular searches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickSearchLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={closeAll} className="rounded-[12px] border border-[#d59a6f]/18 px-3 py-2 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/55 hover:text-[#fff7ef]">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#e8b48f]">Protection and policies</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {policyLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={closeAll} className="rounded-[12px] border border-[#d59a6f]/18 px-3 py-2 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/55 hover:text-[#fff7ef]">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href="/help-me-choose" onClick={closeAll} className="rounded-[12px] bg-[#f3cdb0] px-3 py-2 text-sm font-semibold text-[#1c1009]">
                  Help me choose
                </Link>
                <Link href="/compare" onClick={closeAll} className="rounded-[12px] border border-[#d59a6f]/22 px-3 py-2 text-sm font-semibold text-[#f3cdb0]">
                  Price match
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm text-[#e8d0c1] lg:hidden">
        <Link href="/shop" onClick={closeAll} className="shrink-0 rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.035] px-3 py-2">
          Shop Dolls
        </Link>
        <Link href="/warehouse" onClick={closeAll} className="shrink-0 rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.035] px-3 py-2">
          Ready to ship
        </Link>
        <Link href="/customize" onClick={closeAll} className="shrink-0 rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.035] px-3 py-2">
          Customize
        </Link>
        <Link href="/buyer-protection" onClick={closeAll} className="shrink-0 rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.035] px-3 py-2">
          Buyer protection
        </Link>
        {primaryLinks.map(([label, href]) => (
          <Link key={href} href={href} onClick={closeAll} className="shrink-0 rounded-[14px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.035] px-3 py-2">
            {label}
          </Link>
        ))}
      </nav>

      {searchOpen ? (
        <div className="fixed inset-0 z-[90] bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6" onClick={() => setSearchOpen(false)}>
          <div className="mx-auto max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="rounded-[24px] border border-[#d59a6f]/26 bg-[linear-gradient(180deg,#1a110d,#0f0807)] shadow-[0_32px_100px_rgba(0,0,0,0.75)]">
              <div className="flex items-center justify-between border-b border-[#d59a6f]/16 px-5 py-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#e8b48f]">Search the catalog</p>
                  <p className="mt-1 text-sm text-[#d8c0b0]">Use a brand, height, material, or part of a model name. Press Command/Ctrl + K anytime.</p>
                </div>
                <button type="button" onClick={() => setSearchOpen(false)} className="rounded-[14px] border border-[#d59a6f]/20 p-2 text-[#e8d0c1]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSearchSubmit} className="px-5 py-5" data-testid="header-search-form">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex-1">
                    <span className="sr-only">Search query</span>
                    <input
                      autoFocus
                      data-testid="header-search-input"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Try WM, Angelkiss, 165 cm, silicone, warehouse..."
                      className="w-full rounded-[16px] border border-[#d59a6f]/20 bg-[#f6e9dd]/[0.04] px-4 py-3 text-base text-[#fff7ef] outline-none transition placeholder:text-[#a88a79] focus:border-[#e8b48f]/65"
                    />
                  </label>
                  <button type="submit" data-testid="header-search-submit" className="rounded-[16px] bg-[#f3cdb0] px-5 py-3 text-sm font-semibold text-[#1c1009]">
                    Search
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickSearchLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={closeAll} className="rounded-[12px] border border-[#d59a6f]/18 px-3 py-2 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/55 hover:text-[#fff7ef]">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-5 grid gap-2">
                  {searchQuery.trim().length >= 2 ? (
                    <div className="mb-2">
                      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#e8b48f]">Suggested matches</p>
                      <div className="grid gap-2">
                        {searchLoading ? (
                          <div className="rounded-[14px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 text-sm text-[#caa892]">
                            Looking through the catalog...
                          </div>
                        ) : searchResults.length ? (
                          searchResults.map((result) => (
                            <Link
                              key={result.id}
                              href={`/products/${result.handle}`}
                              onClick={closeAll}
                              className="rounded-[14px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 transition hover:border-[#e8b48f]/45 hover:bg-[#f6e9dd]/[0.06]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#fff7ef]">{result.title}</p>
                                  <p className="mt-1 text-xs text-[#caa892]">
                                    {[result.brand, result.material, result.heightCm ? `${result.heightCm} cm` : "", humanizeStockStatus(result.stockStatus)].filter(Boolean).join(" · ")}
                                  </p>
                                </div>
                                {result.price?.amount ? (
                                  <span className="shrink-0 text-sm font-semibold text-[#f3cdb0]">${Math.round(Number(result.price.amount)).toLocaleString()}</span>
                                ) : null}
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="rounded-[14px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 text-sm text-[#caa892]">
                            No direct matches yet. Try a brand, material, height, body type, or price range.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {searchSuggestions.map((suggestion) => (
                    <Link
                      key={suggestion.href}
                      href={suggestion.href}
                      onClick={closeAll}
                      className="flex items-center justify-between rounded-[14px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/45 hover:bg-[#f6e9dd]/[0.06]"
                    >
                      <span>{suggestion.label}</span>
                      <span className="text-xs uppercase tracking-[0.16em] text-[#a88a79]">{suggestion.kind}</span>
                    </Link>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

    </header>
  );
}

function MegaColumn({
  title,
  links,
  cta,
  onNavigate,
  twoColumns = false
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  cta?: { label: string; href: string };
  onNavigate?: () => void;
  twoColumns?: boolean;
}) {
  return (
    <div className="px-2 py-1">
      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#e8b48f]">{title}</p>
      <div className={`grid gap-1.5 ${twoColumns ? "grid-cols-2" : ""}`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="rounded-[10px] px-3 py-1.5 text-[0.88rem] leading-tight text-[#d8c0b0] transition hover:bg-[#f6e9dd]/[0.06] hover:text-[#fff7ef]"
          >
            {link.label}
          </Link>
        ))}
        {cta ? (
          <Link className={`${twoColumns ? "col-span-2" : ""} mt-2 rounded-[10px] border border-[#d59a6f]/22 px-3 py-2 text-[0.82rem] font-semibold text-[#f3cdb0] hover:border-[#f3cdb0]/60`} href={cta.href} onClick={onNavigate}>
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function buildSearchSuggestions(query: string) {
  const normalized = query.toLowerCase().trim();

  const suggestions: Array<{ label: string; href: string; kind: string }> = [];

  if (normalized) {
    suggestions.push({
      label: `Search for “${query.trim()}”`,
      href: `/shop?query=${encodeURIComponent(query.trim())}`,
      kind: "Catalog"
    });
  }

  for (const brand of catalogFilterOptions.brands) {
    const brandTerms = [brand.label.toLowerCase(), brand.value.toLowerCase()];
    if (!normalized || brandTerms.some((term) => term.includes(normalized) || normalized.includes(term))) {
      suggestions.push({
        label: brand.label,
        href: `/shop?brand=${brand.value}`,
        kind: "Brand"
      });
    }
  }

  for (const route of suggestedSearchRoutes) {
    if (!normalized || route.keywords.some((term) => term.includes(normalized) || normalized.includes(term))) {
      suggestions.push({
        label: route.label,
        href: route.href,
        kind: "Shortcut"
      });
    }
  }

  return dedupeSuggestions(suggestions).slice(0, 6);
}

function dedupeSuggestions(suggestions: Array<{ label: string; href: string; kind: string }>) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    if (seen.has(suggestion.href)) return false;
    seen.add(suggestion.href);
    return true;
  });
}

function humanizeStockStatus(value?: string) {
  if (value === "ready_to_ship") return "Ready to ship";
  if (value === "custom") return "Custom order";
  if (value === "check_stock") return "Confirm stock";
  return "";
}
