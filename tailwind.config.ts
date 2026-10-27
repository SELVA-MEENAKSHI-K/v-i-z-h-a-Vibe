import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VizhaVibe palette — warm festival tones over deep ink.
        ink: {
          900: "#0b0a14",
          800: "#15132270",
          700: "#1c1930",
        },
        saffron: {
          400: "#ffb347",
          500: "#ff9e2c",
          600: "#f5820a",
        },
        marigold: {
          400: "#ffd24c",
          500: "#f7c948",
        },
        kumkum: {
          500: "#e23e57",
          600: "#c81d4e",
        },
        peacock: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        plum: {
          500: "#7c3aed",
          600: "#6d28d9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(255, 158, 44, 0.45)",
        panel: "0 20px 60px -20px rgba(0, 0, 0, 0.6)",
      },
      backgroundImage: {
        "festival-radial":
          "radial-gradient(1200px 600px at 20% -10%, rgba(124,58,237,0.25), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(255,158,44,0.18), transparent)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
