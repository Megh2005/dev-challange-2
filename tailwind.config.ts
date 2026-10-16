import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0a0a0a",
        medical: {
          blue: "#1d4ed8",
          blueDark: "#1e40af",
          blueLight: "#eff6ff",
          blueBorder: "#bfdbfe",
          black: "#0a0a0a",
          muted: "#475569",
          border: "#e2e8f0",
          surface: "#ffffff",
          subtle: "#f8fafc",
        },
      },
    },
  },
  plugins: [],
};
export default config;
