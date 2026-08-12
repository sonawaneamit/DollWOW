export type StorefrontTheme = "light" | "dark";

export const STOREFRONT_THEME_STORAGE_KEY = "dollwow-theme";
export const DEFAULT_STOREFRONT_THEME: StorefrontTheme = "light";

export function resolveStorefrontTheme(savedTheme: string | null | undefined): StorefrontTheme {
  return savedTheme === "light" || savedTheme === "dark" ? savedTheme : DEFAULT_STOREFRONT_THEME;
}

export function buildStorefrontThemeInitScript(): string {
  const storageKey = JSON.stringify(STOREFRONT_THEME_STORAGE_KEY);
  const defaultTheme = JSON.stringify(DEFAULT_STOREFRONT_THEME);

  return `(function(){try{var saved=localStorage.getItem(${storageKey});var theme=saved==='light'||saved==='dark'?saved:${defaultTheme};document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme=${defaultTheme};document.documentElement.style.colorScheme=${defaultTheme};}})();`;
}
