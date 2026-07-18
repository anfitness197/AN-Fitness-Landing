import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "360px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brandRed: {
          DEFAULT: "#D61A1F",
          dark: "#8A1013",
          light: "#FF4D52",
          deep: "#3F0002",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-outfit)", "sans-serif"],
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 35s linear infinite",
        rainbow: "rainbow 4s ease infinite",
        "skeleton-pulse": "skeleton-pulse 1.5s ease-in-out infinite",
        "border-glow": "border-glow 2s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        rainbow: {
          "0%": { backgroundPosition: "0%" },
          "100%": { backgroundPosition: "200%" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "border-glow": {
          "0%, 100%": {
            borderColor: "rgba(214, 26, 31, 0.1)",
            boxShadow: "0 0 0 rgba(214, 26, 31, 0)",
          },
          "50%": {
            borderColor: "rgba(214, 26, 31, 0.3)",
            boxShadow: "0 0 15px rgba(214, 26, 31, 0.1)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
