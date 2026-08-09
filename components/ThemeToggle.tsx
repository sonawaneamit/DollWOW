"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type StorefrontTheme = "light" | "dark";

function activeDocumentTheme(): StorefrontTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToThemeChange(onChange: () => void) {
  window.addEventListener("dollwow-theme-change", onChange);
  return () => window.removeEventListener("dollwow-theme-change", onChange);
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeToThemeChange, activeDocumentTheme, () => "light");

  function toggleTheme() {
    const nextTheme: StorefrontTheme = activeDocumentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    window.localStorage.setItem("dollwow-theme", nextTheme);
    window.dispatchEvent(new Event("dollwow-theme-change"));
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="v2-control inline-flex min-h-11 items-center justify-center gap-2 rounded-button px-3 text-[15px] font-semibold text-text hover:bg-surface-tint"
      aria-label={isDark ? "Switch to the light storefront theme" : "Switch to the After Dark storefront theme"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
      <span>{isDark ? "Lights on" : "After dark"}</span>
      {!compact ? <span className="sr-only"> theme</span> : null}
    </button>
  );
}
