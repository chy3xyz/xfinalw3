/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // uiv2 口径：暖金 #e9a23b / 高亮 #f6c46a，底色 #08080c，卡片 #111118
        primary: "#e9a23b",
        "primary-light": "#f6c46a",
        "primary-dark": "#c9871f",
        accent: "#e9a23b",
        void: "#08080c",
        surface: "#111118",
        elevated: "#17171f",
        "void-card": "#111118",
        "void-edge": "#1f1f29",
        ink: {
          1: "#f4f1ea",
          2: "#a7a4ad",
          3: "#6d6a75"
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"]
      }
    }
  },
  plugins: []
}
