"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, HelpCircle, Menu, Scale, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useComparison } from "@/components/compare/ComparisonProvider";
import { analyticsEvents, trackEvent } from "@/lib/analytics/client";
import { brandHubHref } from "@/lib/catalog/brands";
import { catalogFilterOptions } from "@/lib/catalog/filters";

const primaryLinks = [
  { label: "Shop all dolls", href: "/shop/sex-dolls" },
  { label: "Ready to ship", href: "/shop/ready-to-ship" }
] as const;

const mobilePrimaryLinks = [
  ...primaryLinks,
  { label: "Compare dolls", href: "/compare" },
  { label: "Help me choose", href: "/help-me-choose" },
  { label: "Support", href: "/support" }
  ,{ label: "My Dolls", href: "/account/my-dolls" }
] as const;

const helpLinks = [
  { label: "How ordering works", href: "/how-ordering-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Learning Center", href: "/learn" },
  { label: "Compare dolls", href: "/compare" },
  { label: "Price Match", href: "/price-match" },
  { label: "About Us", href: "/why-dollwow" },
  { label: "Certificates", href: "/authorized-vendors" },
  { label: "Buyer protection", href: "/buyer-protection" },
  { label: "Care for Life", href: "/care-for-life" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Scam alert", href: "/scam-alert" }
] as const;

const quickSearchLinks = [
  { label: "Sex dolls", href: "/shop/sex-dolls" },
  { label: "Realistic", href: "/shop/realistic-sex-dolls" },
  { label: "Mini", href: "/shop/mini-sex-dolls" },
  { label: "Affordable", href: "/shop/cheap-sex-dolls" },
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
  { label: "Affordable sex dolls", href: "/shop/cheap-sex-dolls", keywords: ["affordable", "cheap", "budget", "value", "under 1000"] },
  { label: "Ready to ship", href: "/shop/ready-to-ship", keywords: ["ready", "warehouse", "ships", "tomorrow", "stock"] },
  { label: "Custom builds", href: "/shop/custom", keywords: ["custom", "customize", "builder", "options"] },
  { label: "Male dolls", href: "/shop/male-dolls", keywords: ["male", "man", "men"] },
  { label: "Female dolls", href: "/shop/female-dolls", keywords: ["female", "woman", "women"] },
  { label: "Silicone dolls", href: "/shop/silicone", keywords: ["silicone"] },
  { label: "TPE dolls", href: "/shop/tpe", keywords: ["tpe"] }
];

const brandLinks = catalogFilterOptions.brands.map((brand) => ({ label: brand.label, href: brandHubHref(brand.value) }));
const brandMenuColumns = splitIntoBalancedColumns(brandLinks, 3);

const prefetchTargets = [
  "/shop/sex-dolls",
  "/shop/ready-to-ship",
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
  image?: { url: string; altText: string | null; width?: number | null; height?: number | null } | null;
};

type ContentSearchResult = {
  id: string;
  href: string;
  title: string;
  description: string;
  kind: "Guide" | "Page";
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const comparison = useComparison();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultSuggestion[]>([]);
  const [contentSearchResults, setContentSearchResults] = useState<ContentSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shouldQueryRemote = (searchOpen || mobileMenuOpen) && searchQuery.trim().length >= 2;
  // The header reflects the active first-party cart only. A historical
  // resumable checkout is shown separately on /cart and must not resurrect
  // the badge after the shopper clears their current cart.
  const activeCount = cart.count;
  const compareCount = comparison.entries.length;
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
    if (!shouldQueryRemote) return;

    const trimmed = searchQuery.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}&limit=4`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Search failed (${response.status})`);
        const payload = (await response.json()) as { results?: SearchResultSuggestion[]; contentResults?: ContentSearchResult[] };
        setSearchResults(payload.results || []);
        setContentSearchResults(payload.contentResults || []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setSearchResults([]);
          setContentSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [mobileMenuOpen, searchOpen, searchQuery, shouldQueryRemote]);

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
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
    closeAll();
  }

  function openCart() {
    closeAll();
    cart.openDrawer();
  }

  const shopActive = pathname?.startsWith("/shop") || pathname?.startsWith("/products");
  const readyToShipActive = pathname?.startsWith("/shop/ready-to-ship");
  const brandActive = pathname?.startsWith("/brands");
  const chooseActive = pathname?.startsWith("/help-me-choose");

  return (
    <header className={`site-header sticky top-0 z-[80] h-[72px] bg-surface text-text ${scrolled ? "is-scrolled" : ""}`}>
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-1 px-2 sm:gap-4 sm:px-5 lg:px-8">
        <Link href="/" onClick={closeAll} className="site-header__logo flex min-w-0 shrink-0 items-center" aria-label="DollWow home">
          <span className="relative block h-12 w-10 shrink-0 overflow-hidden sm:w-12" aria-hidden="true">
            <Image
              src="/images/brand/dollwow-black-gold-lockup.png"
              alt=""
              width={650}
              height={235}
              priority
              sizes="155px"
              className="absolute -top-1 left-0 h-14 w-[155px] max-w-none object-contain object-left [clip-path:polygon(0_0,40%_0,40%_50%,28%_50%,28%_78%,40%_78%,40%_100%,0_100%)]"
            />
          </span>
          <span className="site-header__wordmark -ml-1 font-display text-[18px] font-semibold uppercase tracking-[0.08em] text-accent sm:text-[22px] sm:tracking-[0.12em]">
            DollWow
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">
          <HeaderLink href="/shop/sex-dolls" active={shopActive} onNavigate={closeAll}>Shop all dolls</HeaderLink>
          <HeaderLink href="/shop/ready-to-ship" active={readyToShipActive} onNavigate={closeAll}>Ready to ship</HeaderLink>
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
          <CurrencySwitcher />
          <ThemeToggle compact />
          <button type="button" onClick={openSearch} className="header-icon-action v2-icon-control" aria-label="Search products" data-tooltip="Search">
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <Link href="/compare" onClick={closeAll} className="header-icon-action v2-icon-control relative" aria-label={compareLabel(compareCount)} data-tooltip="Compare">
            <Scale className="h-[18px] w-[18px]" aria-hidden="true" />
            {compareCount ? <CartBadge count={compareCount} /> : null}
          </Link>
          <Link href="/support" onClick={closeAll} className="header-icon-action v2-icon-control" aria-label="Get support" data-tooltip="Support">
            <HelpCircle className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          <button type="button" onClick={openCart} className="header-icon-action v2-icon-control relative" aria-label={cartLabel(activeCount)} data-tooltip="Cart">
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
            {activeCount ? <CartBadge count={activeCount} /> : null}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:hidden">
          <button type="button" onClick={openSearch} className="v2-icon-control" aria-label="Search products">
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <Link href="/compare" onClick={closeAll} className="v2-icon-control relative" aria-label={compareLabel(compareCount)}>
            <Scale className="h-5 w-5" aria-hidden="true" />
            {compareCount ? <CartBadge count={compareCount} /> : null}
          </Link>
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
            className="site-header__menu-control v2-control px-2 sm:px-3"
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
        <MobileMenu
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          contentSearchResults={contentSearchResults}
          searchLoading={searchLoading}
          onSubmit={handleSearchSubmit}
          onNavigate={closeAll}
        />
      ) : null}
      {searchOpen ? (
        <SearchDialog
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchSuggestions={searchSuggestions}
          searchResults={searchResults}
          contentSearchResults={contentSearchResults}
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
    <div
      id="desktop-brands-menu"
      className="absolute left-1/2 top-[calc(100%+10px)] z-[85] w-[min(880px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface shadow-panel"
    >
      <div className="flex items-end justify-between gap-6 border-b border-border px-6 py-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">Brand directory</p>
          <p className="mt-1 font-display text-[22px] font-semibold leading-tight text-text">Shop by brand</p>
        </div>
        <p className="pb-0.5 text-[14px] text-text-dim">{brandLinks.length} approved brands</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border px-3 py-3" aria-label="Doll brands">
        {brandMenuColumns.map((column, columnIndex) => (
          <div key={`brand-column-${columnIndex}`} className="px-2">
            {column.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className="flex min-h-11 items-center border-l-2 border-transparent px-3 text-[16px] font-semibold text-text transition-colors hover:border-accent hover:bg-surface-tint focus-visible:border-accent focus-visible:bg-surface-tint"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <Link href="/brands" onClick={onNavigate} className="flex min-h-14 items-center justify-between border-t border-border bg-surface-tint px-6 text-[16px] font-semibold text-accent hover:bg-accent-tint">
        Browse all brands <span className="text-xl" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function splitIntoBalancedColumns<T>(items: ReadonlyArray<T>, columnCount: number): T[][] {
  const itemsPerColumn = Math.ceil(items.length / Math.max(1, columnCount));
  return Array.from({ length: columnCount }, (_, index) => items.slice(index * itemsPerColumn, (index + 1) * itemsPerColumn)).filter(
    (column) => column.length > 0
  );
}

function MobileMenu({ searchQuery, setSearchQuery, searchResults, contentSearchResults, searchLoading, onSubmit, onNavigate }: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: SearchResultSuggestion[];
  contentSearchResults: ContentSearchResult[];
  searchLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNavigate: () => void;
}) {
  return (
    <div id="mobile-menu" className="absolute inset-x-0 top-full z-[79] h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain bg-bg px-5 py-5 shadow-panel lg:hidden">
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

        {searchQuery.trim().length >= 2 ? (
          <div className="mt-2 overflow-hidden rounded-md border border-border bg-surface shadow-card" aria-live="polite">
            {searchLoading ? (
              <p className="px-4 py-4 text-sm text-text-dim">Looking through the catalog...</p>
            ) : (
              <>
                {searchResults.length ? searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/products/${result.handle}`}
                    onClick={onNavigate}
                    className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-text">{result.title}</span>
                      <span className="mt-0.5 block text-sm text-text-dim">
                        {[result.brand, result.heightCm ? `${result.heightCm} cm` : "", result.material].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {result.price?.amount ? <strong className="shrink-0 text-sm text-text"><DisplayMoney amount={result.price.amount} currencyCode={result.price.currencyCode} /></strong> : null}
                  </Link>
                )) : (
                  !contentSearchResults.length ? <p className="border-b border-border px-4 py-3 text-sm text-text-dim">No direct matches in the quick list.</p> : null
                )}
                {contentSearchResults.map((result) => <ContentResultLink key={result.id} result={result} onNavigate={onNavigate} compact />)}
                {searchResults.length ? <AllSearchResultsLink query={searchQuery} onNavigate={onNavigate} compact /> : null}
              </>
            )}
          </div>
        ) : null}

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
        <div className="mt-3"><CurrencySwitcher mobile /></div>
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

function SearchDialog({ searchQuery, setSearchQuery, searchSuggestions, searchResults, contentSearchResults, searchLoading, onClose, onNavigate, onSubmit }: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchSuggestions: Array<{ label: string; href: string; kind: string }>;
  searchResults: SearchResultSuggestion[];
  contentSearchResults: ContentSearchResult[];
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
              <p className="mt-1 text-[15px] leading-6 text-text-dim">Search dolls, brands, guides, and help pages.</p>
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
                  ) : (
                    <>
                      {searchResults.length ? searchResults.map((result) => (
                      <Link key={result.id} href={`/products/${result.handle}`} onClick={onNavigate} className="group flex min-h-20 items-center gap-3 rounded-sm border border-border p-2.5 hover:border-accent hover:bg-accent-tint sm:gap-4 sm:p-3">
                        <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-surface-tint sm:h-24 sm:w-20">
                          {result.image?.url ? (
                            <Image
                              src={result.image.url}
                              alt={result.image.altText || result.title}
                              fill
                              sizes="(min-width: 640px) 80px, 64px"
                              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                              loading="eager"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-text-faint" aria-hidden="true"><ShoppingBag className="h-5 w-5" /></span>
                          )}
                        </span>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-base font-semibold leading-snug text-text">{result.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-text-dim">{[result.brand, result.material, result.heightCm ? `${result.heightCm} cm` : "", humanizeStockStatus(result.stockStatus)].filter(Boolean).join(" · ")}</p>
                          </div>
                          {result.price?.amount ? <DisplayMoney amount={result.price.amount} currencyCode={result.price.currencyCode} className="shrink-0 text-base font-semibold text-text" /> : null}
                        </div>
                      </Link>
                      )) : !contentSearchResults.length ? (
                        <div className="flex min-h-14 items-center rounded-sm bg-surface-tint px-4 text-[15px] text-text-dim">No direct matches in the quick list. Search the full catalog to keep looking.</div>
                      ) : null}
                      {contentSearchResults.length ? (
                        <div className="mt-2 grid gap-2 border-t border-border pt-3">
                          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-text-faint">Guides & pages</p>
                          {contentSearchResults.map((result) => <ContentResultLink key={result.id} result={result} onNavigate={onNavigate} />)}
                        </div>
                      ) : null}
                      {searchResults.length ? <AllSearchResultsLink query={searchQuery} onNavigate={onNavigate} /> : null}
                    </>
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

function ContentResultLink({ result, onNavigate, compact = false }: { result: ContentSearchResult; onNavigate: () => void; compact?: boolean }) {
  return (
    <Link href={result.href} onClick={onNavigate} className={`flex items-center justify-between gap-3 border-border hover:bg-accent-tint ${compact ? "min-h-14 border-b px-4 py-2.5" : "min-h-16 rounded-sm border px-4 py-3"}`}>
      <span className="min-w-0">
        <span className="block font-semibold text-text">{result.title}</span>
        <span className={`mt-0.5 block text-text-dim ${compact ? "line-clamp-1 text-[13px]" : "line-clamp-2 text-sm"}`}>{result.description}</span>
      </span>
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-accent">{result.kind}</span>
    </Link>
  );
}

function CartBadge({ count }: { count: number }) {
  return <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-stock px-1 text-sm font-bold leading-none text-white">{count}</span>;
}

function AllSearchResultsLink({ query, onNavigate, compact = false }: { query: string; onNavigate: () => void; compact?: boolean }) {
  const trimmedQuery = query.trim();
  return (
    <Link
      href={`/shop/sex-dolls?query=${encodeURIComponent(trimmedQuery)}`}
      onClick={onNavigate}
      className={`flex items-center justify-between font-semibold text-accent transition-colors hover:bg-accent hover:text-white ${
        compact ? "min-h-12 px-4 text-[15px]" : "min-h-14 rounded-sm border-2 border-accent px-4 text-base"
      }`}
      data-testid="search-all-results"
    >
      <span>See all dolls for “{trimmedQuery}”</span>
      <span className="text-xl" aria-hidden="true">→</span>
    </Link>
  );
}

function cartLabel(count: number) {
  return count ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart";
}

function compareLabel(count: number) {
  return count ? `Open comparison, ${count} doll${count === 1 ? "" : "s"} selected` : "Compare dolls";
}

function buildSearchSuggestions(query: string) {
  const normalized = query.toLowerCase().trim();
  const suggestions: Array<{ label: string; href: string; kind: string }> = [];

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
