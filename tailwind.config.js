

module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors map to CSS variables (defined in globals.css) so the
        // whole app flips to dark mode via the `.dark` class on <html>.
        background: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        black: "rgb(var(--color-ink) / <alpha-value>)",
        gray: {
          50: "rgb(var(--gray-50) / <alpha-value>)",
          100: "rgb(var(--gray-100) / <alpha-value>)",
          200: "rgb(var(--gray-200) / <alpha-value>)",
          300: "rgb(var(--gray-300) / <alpha-value>)",
          400: "rgb(var(--gray-400) / <alpha-value>)",
          500: "rgb(var(--gray-500) / <alpha-value>)",
          600: "rgb(var(--gray-600) / <alpha-value>)",
          700: "rgb(var(--gray-700) / <alpha-value>)",
          800: "rgb(var(--gray-800) / <alpha-value>)",
          900: "rgb(var(--gray-900) / <alpha-value>)",
          950: "rgb(var(--gray-950) / <alpha-value>)",
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: "#16A34A",
        warning: "#D97706",
        error: "#DC2626",
        info: "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "Geist", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.1", fontWeight: "700" }],
        "h1": ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        "h2": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "h3": ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "small": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "micro": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
        "24": "96px",
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        full: "9999px",
      },
      boxShadow: {
        "1": "0 1px 2px rgba(0,0,0,0.04)",
        "2": "0 4px 12px rgba(0,0,0,0.08)",
        "3": "0 12px 32px rgba(0,0,0,0.12)",
        "4": "0 24px 64px rgba(0,0,0,0.16)",
      },
      transitionDuration: {
        DEFAULT: "120ms",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(at 100% 0%, hsla(237,84%,75%,0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(237,84%,75%,0.1) 0px, transparent 50%)',
      }
    },
  },
  plugins: [],
};


