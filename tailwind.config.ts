import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          "Inter",
          "sans-serif",
        ],
      },
      colors: {
        apple: {
          blue: "#0071e3",
          lightBlue: "#2997ff",
          glassLight: "rgba(255, 255, 255, 0.55)",
          glassDark: "rgba(24, 24, 27, 0.55)",
          borderLight: "rgba(255, 255, 255, 0.6)",
          borderDark: "rgba(255, 255, 255, 0.12)",
        },
      },
      boxShadow: {
        "glass-light": "0 8px 32px 0 rgba(0, 0, 0, 0.06)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        "glass-glow": "0 0 40px -10px rgba(0, 113, 227, 0.35)",
        "glass-dock": "0 20px 50px rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        "2xl": "40px",
        "3xl": "64px",
      },
      animation: {
        "mesh-slow": "meshMove 20s ease-in-out infinite alternate",
        "pulse-subtle": "pulseSubtle 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        meshMove: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(30px, -20px) scale(1.08)" },
          "100%": { transform: "translate(-20px, 30px) scale(0.96)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
