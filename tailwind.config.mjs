/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Primary brand accent: Indigo
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
          DEFAULT: "#4f46e5",
          foreground: "#ffffff",
        },
        // Neutral palette: Zinc
        zinc: colors.zinc,
        // Semantic status colors
        status: {
          paid: colors.emerald[600],
          paidBg: colors.emerald[50],
          paidText: colors.emerald[700],
          partial: colors.amber[600],
          partialBg: colors.amber[50],
          partialText: colors.amber[800],
          due: colors.rose[600],
          dueBg: colors.rose[50],
          dueText: colors.rose[700],
          info: colors.sky[600],
          infoBg: colors.sky[50],
          infoText: colors.sky[700],
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bengali)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        bengali: ["var(--font-bengali)", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        popover: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
