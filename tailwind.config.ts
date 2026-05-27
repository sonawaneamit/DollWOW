import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050505",
          900: "#0B0A08",
          850: "#11100E",
          800: "#15120D",
          750: "#1A1713"
        },
        gold: {
          300: "#FFE1A3",
          400: "#F2C766",
          500: "#D8B15A",
          700: "#7C5E25"
        },
        ivory: {
          50: "#F7F2E8",
          200: "#E8DEC8",
          400: "#C7BFAE",
          600: "#8F8779"
        },
        stock: "#24B36B",
        warn: "#C9872D",
        danger: "#D65A5A"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "Arial", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 80px rgba(216, 177, 90, 0.16)"
      }
    }
  },
  plugins: [forms]
};

export default config;
