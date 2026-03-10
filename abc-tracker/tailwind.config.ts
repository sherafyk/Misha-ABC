import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        warning: {
          100: "#fef3c7",
          300: "#fcd34d",
          500: "#f59e0b",
          700: "#b45309",
        },
        destructive: {
          100: "#fee2e2",
          300: "#fca5a5",
          500: "#ef4444",
          700: "#b91c1c",
        },
        appBackground: {
          50: "#f8fafc",
          100: "#f1f5f9",
        },
      },
    },
  },
};

export default config;
