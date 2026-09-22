/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/operations/**/*.{js,ts,jsx,tsx}",
    "./components/opsIntel/**/*.{js,ts,jsx,tsx}",
    "./components/mentor360/**/*.{js,ts,jsx,tsx}",
    "./lib/opsIntel/**/*.{js,ts,jsx,tsx}",
    "./lib/mentor360/**/*.{js,ts,jsx,tsx}",
    // Mentor Business Performance dashboard (Tailwind-styled page). Scoped to
    // this single file so no utilities leak into the rest of the styled-jsx app.
    "./pages/mentor-performance/index.js",
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ['"Playfair Display"', '"Times New Roman"', 'serif'],
        script: ['"Caveat"', '"Dancing Script"', 'cursive'],
      },
      colors: {
        page: "#F3F6FB",
        card: "#FFFFFF",
        border: "#E6EBF3",
        navy: {
          900: "#0B1220",
          800: "#111C33",
          700: "#16233E",
        },
        gold: {
          DEFAULT: "#F5A623",
          soft: "#FFF3D6",
          dark: "#D59217",
        },
        blue: { DEFAULT: "#3B82F6", soft: "#EAF3FF" },
        green: { DEFAULT: "#10B981", soft: "#EAFBF5" },
        amber: { DEFAULT: "#FBBF24", soft: "#FFF7D8" },
        red: { DEFAULT: "#EF4444", soft: "#FDECEC" },
        purple: { DEFAULT: "#8B5CF6", soft: "#F1EBFF" },
        surface: "#F5F7FA",
        status: {
          good: "#10B981",
          goodBg: "#EAFBF5",
          watch: "#F59E0B",
          watchBg: "#FEF3C7",
          critical: "#EF4444",
          criticalBg: "#FDECEC",
        },
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 2px 10px rgba(15, 23, 42, 0.05)",
      },
      keyframes: {
        heroShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        heroFloat: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(16px)" },
        },
      },
      animation: {
        "hero-shift": "heroShift 14s ease infinite",
        "hero-float": "heroFloat 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
