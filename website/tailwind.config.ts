import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        primary: {
          50: "#eef2f8",
          100: "#d8e3f0",
          200: "#b1c7e1",
          300: "#8aacd2",
          400: "#5b8abd",
          500: "#3b6ea5",
          600: "#1e4d8c",
          700: "#163870",
          800: "#0d2554",
          900: "#0B1D35",
          950: "#060f1c",
        },
        gold: {
          50: "#fef9ec",
          100: "#fdf0c8",
          200: "#fae08d",
          300: "#f8ce52",
          400: "#e9b94a",
          500: "#C8952A",
          600: "#a07220",
          700: "#7d5718",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 4px 16px 0 rgb(0 0 0 / 0.04)",
        "card-hover":
          "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 16px 40px 0 rgb(0 0 0 / 0.08)",
        gold: "0 4px 20px 0 rgb(200 149 42 / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
