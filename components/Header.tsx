"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, HelpCircle, Menu, Search, ShoppingBag, X } from "lucide-react";
import { catalogFilterOptions } from "@/lib/catalog/filters";
import { brandHubHref } from "@/lib/catalog/brands";
import { readBrowserCartState, type BrowserCartState } from "@/lib/cart/browser";

const topLinks = [
  { label: "Ready to ship", href: "/warehouse" },
  { label: "Customize", href: "/customize" },
  { label: "Price Match", href: "/compare" },
  { label: "Help Me Choose", href: "/help-me-choose" },
  { label: "Learning Center", href: "/learn" },
  { label: "About Us", href: "/why-dollwow" }
] as const;

const featuredShopLinks = [
  { label: "Sex dolls", href: "/shop/sex-dolls" },
  { label: "Realistic sex dolls", href: "/shop/realistic-sex-dolls" },
  { label: "Mini sex dolls", href: "/shop/mini-sex-dolls" },
  { label: "Ready to ship", href: "/shop/ready-to-ship" },
  { label: "Factory order", href: "/shop/custom" },
  { label: "Female dolls", href: "/shop/female-dolls" },
  { label: "Male dolls", href: "/shop/male-dolls" }
];

const policyLinks = [
  { label: "Buyer protection", href: "/buyer-protection" },
  { label: "Shipping protection", href: "/shipping-protection" },
  { label: "Best price guarantee", href: "/best-price-guarantee" },
  { label: "How ordering works", href: "/how-ordering-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Returns", href: "/returns" },
  { label: "Shipping guide", href: "/shipping" },
  { label: "Scam alert", href: "/scam-alert" }
];

const quickSearchLinks = [
  { label: "Sex dolls", href: "/shop/sex-dolls" },
  { label: "Realistic", href: "/shop/realistic-sex-dolls" },
  { label: "Mini", href: "/shop/mini-sex-dolls" },
  { label: "WM Dolls", href: "/brands/wm-dolls" },
  { label: "Angelkiss", href: "/brands/angelkiss-dolls" },
  { label: "Irontech", href: "/brands/irontech-dolls" },
  { label: "Silicone", href: "/shop/silicone" },
  { label: "TPE", href: "/shop/tpe" },
  { label: "170 cm+", href: "/shop/height-170-plus" }
];

const suggestedSearchRoutes = [
  { label: "Sex dolls", href: "/shop/sex-dolls", keywords: ["sex", "doll", "dolls", "adult"] },
  { label: "Realistic sex dolls", href: "/shop/realistic-sex-dolls", keywords: ["realistic", "real", "lifelike"] },
  { label: "Mini sex dolls", href: "/shop/mini-sex-dolls", keywords: ["mini", "petite", "small", "compact"] },
  { label: "Ready to ship", href: "/shop/ready-to-ship", keywords: ["ready", "warehouse", "ships", "tomorrow", "stock"] },
  { label: "Custom builds", href: "/shop/custom", keywords: ["custom", "customize", "builder", "options"] },
  { label: "Male dolls", href: "/shop/male-dolls", keywords: ["male", "man", "men"] },
  { label: "Female dolls", href: "/shop/female-dolls", keywords: ["female", "woman", "women"] },
  { label: "Silicone dolls", href: "/shop/silicone", keywords: ["silicone"] },
  { label: "TPE dolls", href: "/shop/tpe", keywords: ["tpe"] }
];

const brandLinks = catalogFilterOptions.brands.map((brand) => ({
  label: brand.label,
  href: brandHubHref(brand.value)
}));

const heightLinks = catalogFilterOptions.heights.map((height) => ({
  label: height.label,
  href: `/shop?height=${height.value}`
}));

const materialLinks = catalogFilterOptions.materials.map((material) => ({
  label: material.label,
  href: `/shop?material=${material.value}`
}));

const prefetchTargets = [
  "/shop",
  "/warehouse",
  "/customize",
  "/compare",
  "/help-me-choose",
  "/learn",
  "/why-dollwow",
  "/support",
  "/cart",
  ...featuredShopLinks.map((link) => link.href),
  ...quickSearchLinks.map((link) => link.href)
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartState, setCartState] = useState<BrowserCartState | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const shouldQueryRemote = searchOpen && searchQuery.trim().length >= 2;

  const activeCount = cartState?.totalQuantity ?? 0;
  const searchSuggestions = useMemo(() => buildSearchSuggestions(searchQuery), [searchQuery]);
  const activeLabel = useMemo(() => {
    if (pathname?.startsWith("/warehouse")) return "Ready to ship";
    if (pathname?.startsWith("/customize")) return "Customize";
    if (pathname?.startsWith("/compare")) return "Price Match";
    if (pathname?.startsWith("/help-me-choose")) return "Help Me Choose";
    if (pathname?.startsWith("/learn")) return "Learning Center";
    if (pathname?.startsWith("/why-dollwow")) return "About Us";
    if (pathname?.startsWith("/shop") || pathname?.startsWith("/products")) return "Shop Dolls";
    return "";
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
    for (const href of Array.from(new Set(prefetchTargets))) {
      router.prefetch(href);
    }
  }, [router]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAll();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileMenuOpen(false);
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!shopMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (target?.closest("[data-shop-menu-root]")) return;
      setShopMenuOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [shopMenuOpen]);

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
    setMobileMenuOpen(false);
    setShopMenuOpen(false);
    setSearchOpen(true);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(trimmed ? `/shop?query=${encodeURIComponent(trimmed)}` : "/shop");
    closeAll();
  }

  function closeAll() {
    setMobileMenuOpen(false);
    setShopMenuOpen(false);
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-[80] border-b border-[#d59a6f]/22 bg-[#160c0a] text-[#f6e9dd] shadow-[0_18px_54px_rgba(20,6,4,0.28)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" onClick={closeAll} className="flex shrink-0 items-center" aria-label="DollWow home">
          <Image
            src="/images/brand/dollwow-black-gold-lockup.png"
            alt="DollWow.com"
            width={650}
            height={235}
            priority
            sizes="(max-width: 640px) 190px, 260px"
            className="h-14 w-[190px] rounded-[6px] object-contain object-left sm:h-16 sm:w-[260px]"
          />
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-[#e8d0c1] lg:flex" aria-label="Primary navigation">
          <div data-shop-menu-root>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setMobileMenuOpen(false);
                setShopMenuOpen((value) => !value);
              }}
              className={`inline-flex items-center gap-1.5 rounded-[12px] px-3 py-2 transition hover:bg-[#f6e9dd]/[0.07] hover:text-[#fff7ef] ${activeLabel === "Shop Dolls" || shopMenuOpen ? "bg-[#f6e9dd]/[0.07] text-[#fff7ef]" : ""}`}
              aria-expanded={shopMenuOpen}
              aria-controls="desktop-shop-menu"
            >
              Shop Dolls
              <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition ${shopMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {shopMenuOpen ? <DesktopShopDropdown onNavigate={closeAll} /> : null}
          </div>
          {topLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeAll}
              className={`rounded-[12px] px-3 py-2 transition hover:bg-[#f6e9dd]/[0.07] hover:text-[#fff7ef] ${activeLabel === link.label ? "bg-[#f6e9dd]/[0.07] text-[#fff7ef]" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-[#f1d2cb]">
          <button
            type="button"
            onClick={openSearch}
            className="rounded-[12px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]"
            aria-label="Search products"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link href="/support" onClick={closeAll} className="hidden rounded-[12px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd] sm:inline-flex" aria-label="Get help">
            <HelpCircle className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            onClick={closeAll}
            className="relative rounded-[12px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd]"
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
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setShopMenuOpen(false);
              setMobileMenuOpen((value) => !value);
            }}
            className="rounded-[12px] border border-[#d59a6f]/24 bg-[#f6e9dd]/[0.055] p-2 transition hover:border-[#e8b48f]/60 hover:text-[#f6e9dd] lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? <MobileMenu onNavigate={closeAll} /> : null}
      {searchOpen ? (
        <SearchDialog
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchSuggestions={searchSuggestions}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onClose={() => setSearchOpen(false)}
          onNavigate={closeAll}
          onSubmit={handleSearchSubmit}
        />
      ) : null}
    </header>
  );
}

function DesktopShopDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div
      id="desktop-shop-menu"
      data-shop-menu-root
      className="fixed inset-x-0 top-[65px] z-[85] border-y border-[#d59a6f]/22 bg-[#100806] shadow-[0_32px_90px_rgba(0,0,0,0.62)]"
    >
      <div className="mx-auto max-h-[calc(100vh-65px)] max-w-7xl overflow-y-auto px-6 py-6 lg:px-8">
        <div className="overflow-hidden border border-[#d59a6f]/26 bg-[linear-gradient(180deg,#1b100d,#0d0605)]">
          <div className="grid gap-0 border-b border-[#d59a6f]/16 p-5 lg:grid-cols-[1.2fr_0.85fr_0.85fr_1fr]">
            <MenuColumn title="Brands" links={brandLinks.slice(0, 12)} twoColumns onNavigate={onNavigate} />
            <MenuColumn title="Height" links={heightLinks} onNavigate={onNavigate} />
            <MenuColumn title="Material" links={materialLinks} onNavigate={onNavigate} />
            <MenuColumn title="Popular" links={featuredShopLinks} onNavigate={onNavigate} />
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#e8b48f]">Quick links</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickSearchLinks.map((link) => (
                  <HeaderPill key={link.href} href={link.href} label={link.label} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Link href="/help-me-choose" onClick={onNavigate} className="rounded-[12px] bg-[#f3cdb0] px-4 py-2 text-sm font-semibold text-[#1c1009]">
                Help me choose
              </Link>
              <Link href="/compare" onClick={onNavigate} className="rounded-[12px] border border-[#d59a6f]/30 px-4 py-2 text-sm font-semibold text-[#f3cdb0] hover:border-[#f3cdb0]/60">
                Price match
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div id="mobile-menu" className="max-h-[calc(100dvh-74px)] overflow-y-auto border-t border-[#d59a6f]/18 bg-[#100806] px-4 py-4 shadow-[0_28px_80px_rgba(0,0,0,0.7)] lg:hidden">
      <div className="space-y-3">
        <Link
          href="/shop/sex-dolls"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-[14px] border border-[#d59a6f]/22 bg-[#f6e9dd]/[0.055] px-4 py-3 text-base font-semibold text-[#fff7ef]"
        >
          Shop sex dolls
          <span className="text-xs uppercase tracking-[0.16em] text-[#e8b48f]">Catalog</span>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          {topLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="rounded-[12px] border border-[#d59a6f]/18 bg-[#f6e9dd]/[0.035] px-3 py-3 text-sm font-semibold text-[#ead4c6]"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/support" onClick={onNavigate} className="rounded-[12px] border border-[#d59a6f]/18 bg-[#f6e9dd]/[0.035] px-3 py-3 text-sm font-semibold text-[#ead4c6]">
            Support
          </Link>
        </div>

        <MobileDetails title="Brands" links={brandLinks.slice(0, 12)} onNavigate={onNavigate} />
        <MobileDetails title="Popular collections" links={featuredShopLinks} onNavigate={onNavigate} />
        <MobileDetails title="Shop by height" links={heightLinks} onNavigate={onNavigate} />
        <MobileDetails title="Material" links={materialLinks} onNavigate={onNavigate} />
        <MobileDetails title="Protection and policies" links={policyLinks} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function MenuColumn({
  title,
  links,
  twoColumns = false,
  onNavigate
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  twoColumns?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="px-2 py-1">
      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#e8b48f]">{title}</p>
      <div className={`grid gap-1.5 ${twoColumns ? "grid-cols-2" : ""}`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="rounded-[8px] px-3 py-1.5 text-[0.88rem] leading-tight text-[#d8c0b0] transition hover:bg-[#f6e9dd]/[0.06] hover:text-[#fff7ef]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileDetails({
  title,
  links,
  onNavigate
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  onNavigate: () => void;
}) {
  return (
    <details className="group rounded-[14px] border border-[#d59a6f]/18 bg-[#f6e9dd]/[0.035]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#e8b48f] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-2 gap-1 border-t border-[#d59a6f]/14 p-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={onNavigate} className="rounded-[10px] px-3 py-2 text-sm text-[#ead4c6] hover:bg-[#f6e9dd]/[0.06]">
            {link.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

function HeaderPill({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className="rounded-[10px] border border-[#d59a6f]/18 px-3 py-2 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/55 hover:text-[#fff7ef]">
      {label}
    </Link>
  );
}

function SearchDialog({
  searchQuery,
  setSearchQuery,
  searchSuggestions,
  searchResults,
  searchLoading,
  onClose,
  onNavigate,
  onSubmit
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchSuggestions: Array<{ label: string; href: string; kind: string }>;
  searchResults: SearchResultSuggestion[];
  searchLoading: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 px-4 py-6 backdrop-blur-sm sm:px-6" onClick={onClose}>
      <div className="mx-auto max-w-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="rounded-[20px] border border-[#d59a6f]/26 bg-[linear-gradient(180deg,#1a110d,#0f0807)] shadow-[0_32px_100px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between border-b border-[#d59a6f]/16 px-5 py-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#e8b48f]">Search the catalog</p>
              <p className="mt-1 text-sm text-[#d8c0b0]">Use a brand, height, material, or part of a model name.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-[12px] border border-[#d59a6f]/20 p-2 text-[#e8d0c1]" aria-label="Close search">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="px-5 py-5" data-testid="header-search-form">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-1">
                <span className="sr-only">Search query</span>
                <input
                  autoFocus
                  data-testid="header-search-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Try WM, Angelkiss, 165 cm, silicone, warehouse..."
                  className="w-full rounded-[14px] border border-[#d59a6f]/20 bg-[#f6e9dd]/[0.04] px-4 py-3 text-base text-[#fff7ef] outline-none transition placeholder:text-[#a88a79] focus:border-[#e8b48f]/65"
                />
              </label>
              <button type="submit" data-testid="header-search-submit" className="rounded-[14px] bg-[#f3cdb0] px-5 py-3 text-sm font-semibold text-[#1c1009]">
                Search
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickSearchLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={onNavigate} className="rounded-[10px] border border-[#d59a6f]/18 px-3 py-2 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/55 hover:text-[#fff7ef]">
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
                      <div className="rounded-[12px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 text-sm text-[#caa892]">
                        Looking through the catalog...
                      </div>
                    ) : searchResults.length ? (
                      searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/products/${result.handle}`}
                          onClick={onNavigate}
                          className="rounded-[12px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 transition hover:border-[#e8b48f]/45 hover:bg-[#f6e9dd]/[0.06]"
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
                      <div className="rounded-[12px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 text-sm text-[#caa892]">
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
                  onClick={onNavigate}
                  className="flex items-center justify-between rounded-[12px] border border-[#d59a6f]/16 bg-[#f6e9dd]/[0.035] px-4 py-3 text-sm text-[#ead4c6] transition hover:border-[#e8b48f]/45 hover:bg-[#f6e9dd]/[0.06]"
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
        href: brandHubHref(brand.value),
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
