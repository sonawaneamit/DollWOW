"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, HelpCircle, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/components/cart/CartProvider";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { useLegacyCartState } from "@/lib/cart/browser";
import { brandHubHref } from "@/lib/catalog/brands";
import { catalogFilterOptions } from "@/lib/catalog/filters";

const primaryLinks = [
  { label: "Shop all dolls", href: "/shop" },
  { label: "Ready to ship", href: "/warehouse" }
] as const;

const mobilePrimaryLinks = [
  ...primaryLinks,
  { label: "Help me choose", href: "/help-me-choose" },
  { label: "Support", href: "/support" }
] as const;

const helpLinks = [
  { label: "How ordering works", href: "/how-ordering-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Learning Center", href: "/learn" },
  { label: "Price Match", href: "/compare" },
  { label: "About Us", href: "/why-dollwow" },
  { label: "Certificates", href: "/authorized-vendors" },
  { label: "Buyer protection", href: "/buyer-protection" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Scam alert", href: "/scam-alert" }
] as const;

const quickSearchLinks = [
  { label: "Sex dolls", href: "/shop/sex-dolls" },
  { label: "Realistic", href: "/shop/realistic-sex-dolls" },
  { label: "Mini", href: "/shop/mini-sex-dolls" },
  { label: "WM Dolls", href: "/brands/wm-dolls" },
  { label: "Angelkiss", href: "/brands/angelkiss-dolls" },
  { label: "Irontech", href: "/brands/irontech-dolls" },
  { label: "Real Lady", href: "/brands/real-lady-dolls" },
  { label: "Avant Doll", href: "/brands/avant-dolls" },
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

const brandLinks = catalogFilterOptions.brands.map((brand) => ({ label: brand.label, href: brandHubHref(brand.value) }));

const prefetchTargets = [
  "/shop",
  "/warehouse",
  "/help-me-choose",
  "/support",
  "/cart",
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
  const cart = useCart();
  const cartState = useLegacyCartState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shouldQueryRemote = searchOpen && searchQuery.trim().length >= 2;
  const activeCount = cart.count || (cartState?.totalQuantity ?? 0);
  const searchSuggestions = useMemo(() => buildSearchSuggestions(searchQuery), [searchQuery]);

  useEffect(() => {
    for (const href of Array.from(new Set(prefetchTargets))) router.prefetch(href);
  }, [router]);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAll();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileMenuOpen(false);
        setBrandsOpen(false);
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!brandsOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (!target?.closest("[data-brands-menu-root]")) setBrandsOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [brandsOpen]);

  useEffect(() => {
    if (!shouldQueryRemote) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const trimmed = searchQuery.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&limit=4`, { signal: controller.signal });
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

  function closeAll() {
    setMobileMenuOpen(false);
    setBrandsOpen(false);
    setSearchOpen(false);
  }

  function openSearch() {
    setMobileMenuOpen(false);
    setBrandsOpen(false);
    setSearchOpen(true);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) trackEvent(analyticsEvents.search, { search_term: trimmed });
    router.push(trimmed ? `/shop?query=${encodeURIComponent(trimmed)}` : "/shop");
    closeAll();
  }

  function openCart() {
    closeAll();
    cart.openDrawer();
  }

  const shopActive = pathname?.startsWith("/shop") || pathname?.startsWith("/products");
  const warehouseActive = pathname?.startsWith("/warehouse");
  const brandActive = pathname?.startsWith("/brands");
  const chooseActive = pathname?.startsWith("/help-me-choose");

  return (
    <header className={`sticky top-0 z-[80] h-[72px] bg-surface text-text transition-shadow ${scrolled ? "shadow-sticky" : ""}`}>
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-4 px-5 lg:px-8">
        <Link href="/" onClick={closeAll} className="flex shrink-0 items-center" aria-label="DollWow home">
          <Image
            src="/images/brand/dollwow-black-gold-lockup.png"
            alt="DollWow.com"
            width={650}
            height={235}
            priority
            sizes="(max-width: 640px) 150px, 176px"
            className="h-12 w-[150px] object-contain object-left lg:w-44"
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">
          <HeaderLink href="/shop" active={shopActive} onNavigate={closeAll}>Shop all dolls</HeaderLink>
          <HeaderLink href="/warehouse" active={warehouseActive} onNavigate={closeAll}>Ready to ship</HeaderLink>
          <div className="relative" data-brands-menu-root>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setMobileMenuOpen(false);
                setBrandsOpen((value) => !value);
              }}
              className={`v2-header-link ${brandActive || brandsOpen ? "is-active" : ""}`}
              aria-expanded={brandsOpen}
              aria-controls="desktop-brands-menu"
            >
              Brands
              <ChevronDown className={`h-4 w-4 transition-transform ${brandsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {brandsOpen ? <BrandsDropdown onNavigate={closeAll} /> : null}
          </div>
          <Link
            href="/help-me-choose"
            onClick={closeAll}
            className={`ml-1 inline-flex min-h-11 items-center rounded-button border-2 border-accent px-4 text-[16px] font-semibold text-accent transition-colors hover:bg-accent-tint ${chooseActive ? "bg-accent-tint" : ""}`}
          >
            Help me choose
          </Link>
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
          <ThemeToggle compact />
          <button type="button" onClick={openSearch} className="v2-control" aria-label="Search products">
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
            <span>Search</span>
          </button>
          <Link href="/support" onClick={closeAll} className="v2-control" aria-label="Get support">
            <HelpCircle className="h-[18px] w-[18px]" aria-hidden="true" />
            <span>Support</span>
          </Link>
          <button type="button" onClick={openCart} className="v2-control relative" aria-label={cartLabel(activeCount)}>
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            <span>Cart</span>
            {activeCount ? <CartBadge count={activeCount} /> : null}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <button type="button" onClick={openCart} className="v2-icon-control relative" aria-label={cartLabel(activeCount)}>
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {activeCount ? <CartBadge count={activeCount} /> : null}
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setBrandsOpen(false);
              setMobileMenuOpen((value) => !value);
            }}
            className="v2-control px-3"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <MobileMenu searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSubmit={handleSearchSubmit} onNavigate={closeAll} />
      ) : null}
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

function HeaderLink({ href, active, onNavigate, children }: { href: string; active?: boolean; onNavigate: () => void; children: React.ReactNode }) {
  return <Link href={href} onClick={onNavigate} className={`v2-header-link ${active ? "is-active" : ""}`}>{children}</Link>;
}

function BrandsDropdown({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div id="desktop-brands-menu" className="absolute left-1/2 top-[calc(100%+10px)] z-[85] w-[min(420px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-lg bg-surface shadow-panel">
      <div className="max-h-[min(65vh,620px)] overflow-y-auto p-2">
        {brandLinks.map((link) => (
          <Link key={link.href} href={link.href} onClick={onNavigate} className="flex min-h-12 items-center rounded-sm px-4 text-[17px] font-semibold text-text transition-colors hover:bg-surface-tint">
            {link.label}
          </Link>
        ))}
      </div>
      <Link href="/brands" onClick={onNavigate} className="flex min-h-12 items-center justify-between border-t border-border bg-surface-tint px-6 text-[17px] font-semibold text-accent">
        All brands <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function MobileMenu({ searchQuery, setSearchQuery, onSubmit, onNavigate }: { searchQuery: string; setSearchQuery: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onNavigate: () => void }) {
  return (
    <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[72px] z-[79] overflow-y-auto bg-bg px-5 py-5 lg:hidden">
      <div className="mx-auto max-w-2xl pb-10">
        <form onSubmit={onSubmit} className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-dim" aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search dolls, brands, materials..."
            className="h-[52px] w-full rounded-sm border border-border bg-surface pl-12 pr-4 text-base text-text placeholder:text-text-faint focus:border-accent focus:ring-accent"
            aria-label="Search the catalog"
          />
        </form>

        <nav className="mt-4 grid gap-2" aria-label="Mobile navigation">
          {mobilePrimaryLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={onNavigate} className="flex min-h-14 items-center justify-between rounded-md bg-surface px-5 text-lg font-semibold text-text shadow-card">
              {link.label}<span className="text-accent" aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>

        <div className="mt-4 grid gap-3">
          <MobileDetails title="Brands" links={brandLinks} onNavigate={onNavigate} />
          <MobileDetails title="Help & information" links={helpLinks} onNavigate={onNavigate} />
        </div>

        <div className="mt-4 rounded-md bg-surface p-2 shadow-card">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function MobileDetails({ title, links, onNavigate }: { title: string; links: ReadonlyArray<{ label: string; href: string }>; onNavigate: () => void }) {
  return (
    <details className="group overflow-hidden rounded-md bg-surface shadow-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-lg font-semibold text-text [&::-webkit-details-marker]:hidden">
        {title}<ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-border px-2 py-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={onNavigate} className="flex min-h-12 items-center rounded-sm px-4 text-[17px] text-text-dim hover:bg-surface-tint hover:text-text">
            {link.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

function SearchDialog({ searchQuery, setSearchQuery, searchSuggestions, searchResults, searchLoading, onClose, onNavigate, onSubmit }: {
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
    <div className="fixed inset-0 z-[90] bg-[rgba(41,32,27,0.45)] px-5 py-6" onClick={onClose} role="presentation">
      <div className="mx-auto max-w-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="max-h-[calc(100dvh-48px)] overflow-y-auto rounded-lg bg-surface text-text shadow-panel" role="dialog" aria-modal="true" aria-label="Search the catalog">
          <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-7">
            <div>
              <h2 className="font-display text-2xl font-semibold">Search the catalog</h2>
              <p className="mt-1 text-[15px] leading-6 text-text-dim">Use a brand, height, material, or part of a model name.</p>
            </div>
            <button type="button" onClick={onClose} className="v2-icon-control shrink-0" aria-label="Close search"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={onSubmit} className="border-t border-border px-5 py-5 sm:px-7" data-testid="header-search-form">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex-1">
                <span className="sr-only">Search query</span>
                <input
                  autoFocus
                  data-testid="header-search-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Try Irontech, 165 cm, silicone, warehouse..."
                  className="h-14 w-full rounded-sm border border-border bg-surface px-4 text-lg text-text placeholder:text-text-faint focus:border-accent focus:ring-accent"
                />
              </label>
              <button type="submit" data-testid="header-search-submit" className="min-h-14 rounded-button bg-accent px-6 text-[17px] font-semibold text-white hover:bg-accent-hover">Search</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickSearchLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={onNavigate} className="inline-flex min-h-11 items-center rounded-sm border border-border px-3 text-[15px] font-semibold text-text-dim hover:border-accent hover:bg-accent-tint hover:text-text">{link.label}</Link>
              ))}
            </div>

            {searchQuery.trim().length >= 2 ? (
              <div className="mt-6">
                <p className="mb-2 text-[15px] font-semibold text-text-dim">Suggested matches</p>
                <div className="grid gap-2" aria-live="polite">
                  {searchLoading ? (
                    <div className="flex min-h-14 items-center rounded-sm bg-surface-tint px-4 text-[15px] text-text-dim">Looking through the catalog...</div>
                  ) : searchResults.length ? (
                    searchResults.map((result) => (
                      <Link key={result.id} href={`/products/${result.handle}`} onClick={onNavigate} className="flex min-h-14 items-center justify-between gap-4 rounded-sm border border-border px-4 py-3 hover:border-accent hover:bg-accent-tint">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-text">{result.title}</p>
                          <p className="mt-1 text-sm text-text-dim">{[result.brand, result.material, result.heightCm ? `${result.heightCm} cm` : "", humanizeStockStatus(result.stockStatus)].filter(Boolean).join(" · ")}</p>
                        </div>
                        {result.price?.amount ? <span className="shrink-0 text-base font-semibold text-text">${Math.round(Number(result.price.amount)).toLocaleString()}</span> : null}
                      </Link>
                    ))
                  ) : (
                    <div className="flex min-h-14 items-center rounded-sm bg-surface-tint px-4 text-[15px] text-text-dim">No direct matches yet. Try a brand, material, height, body type, or price range.</div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-2">
              {searchSuggestions.map((suggestion) => (
                <Link key={suggestion.href} href={suggestion.href} onClick={onNavigate} className="flex min-h-14 items-center justify-between rounded-sm bg-surface-tint px-4 text-base text-text hover:bg-accent-tint">
                  <span>{suggestion.label}</span><span className="text-sm font-medium text-text-faint">{suggestion.kind}</span>
                </Link>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CartBadge({ count }: { count: number }) {
  return <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-stock px-1 text-xs font-bold leading-none text-white">{count}</span>;
}

function cartLabel(count: number) {
  return count ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart";
}

function buildSearchSuggestions(query: string) {
  const normalized = query.toLowerCase().trim();
  const suggestions: Array<{ label: string; href: string; kind: string }> = [];

  if (normalized) suggestions.push({ label: `Search for “${query.trim()}”`, href: `/shop?query=${encodeURIComponent(query.trim())}`, kind: "Catalog" });

  for (const brand of catalogFilterOptions.brands) {
    const brandTerms = [brand.label.toLowerCase(), brand.value.toLowerCase()];
    if (!normalized || brandTerms.some((term) => term.includes(normalized) || normalized.includes(term))) {
      suggestions.push({ label: brand.label, href: brandHubHref(brand.value), kind: "Brand" });
    }
  }

  for (const route of suggestedSearchRoutes) {
    if (!normalized || route.keywords.some((term) => term.includes(normalized) || normalized.includes(term))) {
      suggestions.push({ label: route.label, href: route.href, kind: "Shortcut" });
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
