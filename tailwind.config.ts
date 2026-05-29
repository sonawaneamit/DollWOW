import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070403",
          900: "#100A08",
          850: "#160D0A",
          800: "#1A110D",
          750: "#21150F",
          700: "#302119",
          500: "#6A5648"
        },
        gold: {
          200: "#F3CDB0",
          300: "#E8B48F",
          400: "#D59A6F",
          500: "#B97A4E",
          600: "#8D5736",
          700: "#5D3524"
        },
        ivory: {
          50: "#F6E9DD",
          200: "#EAD2C1",
          400: "#C9B3A3",
          500: "#B19988",
          600: "#98826F"
        },
        stock: "#24B36B",
        warn: "#D59A6F",
        danger: "#C0695E"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(217, 154, 111, 0.12), 0 24px 80px rgba(185, 90, 60, 0.14)",
        soft: "0 40px 110px rgba(20, 6, 4, 0.62)"
      }
    }
  },
  plugins: [forms]
};

export default config;
