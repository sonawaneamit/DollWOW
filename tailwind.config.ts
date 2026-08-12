import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-tint": "rgb(var(--color-surface-tint) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-dim": "rgb(var(--color-text-dim) / <alpha-value>)",
        "text-faint": "rgb(var(--color-text-faint) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-hover": "rgb(var(--color-accent-hover) / <alpha-value>)",
        "accent-tint": "rgb(var(--color-accent-tint) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",
        "stock-tint": "rgb(var(--color-stock-tint) / <alpha-value>)",
        "danger-tint": "rgb(var(--color-danger-tint) / <alpha-value>)",
        ink: {
          950: "rgb(var(--color-surface) / <alpha-value>)",
          900: "rgb(var(--color-surface) / <alpha-value>)",
          850: "rgb(var(--color-surface) / <alpha-value>)",
          800: "rgb(var(--color-surface-tint) / <alpha-value>)",
          750: "rgb(var(--color-surface-tint) / <alpha-value>)",
          700: "rgb(var(--color-text-dim) / <alpha-value>)",
          500: "rgb(var(--color-text-faint) / <alpha-value>)"
        },
        gold: {
          200: "rgb(var(--color-accent) / <alpha-value>)",
          300: "rgb(var(--color-accent) / <alpha-value>)",
          400: "rgb(var(--color-accent) / <alpha-value>)",
          500: "rgb(var(--color-accent) / <alpha-value>)",
          600: "rgb(var(--color-accent-hover) / <alpha-value>)",
          700: "rgb(var(--color-accent-hover) / <alpha-value>)"
        },
        ivory: {
          50: "rgb(var(--color-text) / <alpha-value>)",
          200: "rgb(var(--color-text) / <alpha-value>)",
          400: "rgb(var(--color-text-dim) / <alpha-value>)",
          500: "rgb(var(--color-text-dim) / <alpha-value>)",
          600: "rgb(var(--color-text-faint) / <alpha-value>)"
        },
        stock: "rgb(var(--color-stock) / <alpha-value>)",
        warn: "rgb(var(--color-accent) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 6px 24px rgba(41, 32, 27, 0.07)",
        panel: "0 12px 40px rgba(41, 32, 27, 0.10)",
        sticky: "0 4px 20px rgba(41, 32, 27, 0.08)",
        glow: "0 6px 24px rgba(41, 32, 27, 0.07)",
        soft: "0 12px 40px rgba(41, 32, 27, 0.10)"
      },
      borderRadius: {
        /* DollWOW radius hierarchy:
           - structure stays nearly square;
           - controls and media get a restrained soft edge;
           - pills/circles must use rounded-full intentionally.
           This keeps the interface editorial instead of turning every layer
           into a nested app card. */
        sm: "4px",
        md: "6px",
        lg: "8px",
        button: "6px"
      }
    }
  },
  plugins: [forms]
};

export default config;
