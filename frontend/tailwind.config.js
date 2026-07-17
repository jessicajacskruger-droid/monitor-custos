/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070F1F",
          900: "#0B1F3A",
          800: "#122B52",
          700: "#1A3A6B",
          600: "#234A85",
        },
        brand: {
          50: "#EEF3FB",
          100: "#DCE7F7",
          200: "#B3CBEE",
          300: "#7FA8E0",
          400: "#4C82D0",
          500: "#2E63B3",
          600: "#1E4B8F",
          700: "#173A70",
          800: "#122B52",
          900: "#0B1F3A",
        },
        violet: {
          400: "#8B72E8",
          500: "#6C4FD1",
          600: "#5A3EB8",
        },
        surface: {
          DEFAULT: "#F5F7FA",
          card: "#FFFFFF",
          muted: "#EEF1F6",
        },
        danger: {
          50: "#FDECEC",
          500: "#DC2626",
          600: "#B91C1C",
        },
        success: {
          50: "#EAF7F0",
          500: "#1F9D63",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 31, 58, 0.06), 0 1px 6px rgba(11, 31, 58, 0.06)",
        cardHover: "0 4px 14px rgba(11, 31, 58, 0.12)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};
