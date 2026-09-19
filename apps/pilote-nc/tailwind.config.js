const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: false,
  important: true,
  theme: {
    extend: {
      colors: {
        // Palette neutre générique pour pilote-nc (pas de branding DSFR/Marianne).
        // À remplacer par la charte graphique officielle du gouvernement de la
        // Nouvelle-Calédonie quand elle sera fournie.
        primary: "#1E3A5F",
        "primary-hover": "#16293F",
        secondary: "#2B6E7A",
        success: "#1F8A45",
        warning: "#B36A00",
        error: "#C4272A",
        info: "#2563AC",
        "neutral-50": "#F7F8F9",
        "neutral-100": "#EEF0F2",
        "neutral-200": "#DDE1E5",
        "neutral-300": "#C4CAD1",
        "neutral-400": "#9AA3AD",
        "neutral-500": "#6E7883",
        "neutral-600": "#525C66",
        "neutral-700": "#3B424A",
        "neutral-800": "#262B30",
        "neutral-900": "#15181B",
      },
      keyframes: {
        "dropdown-fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "dropdown-fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "dropdown-fade-in": "dropdown-fade-in 150ms ease-out",
        "dropdown-fade-out": "dropdown-fade-out 150ms ease-in",
        "fade-in": "fade-in 300ms ease-out",
        "slide-up": "slide-up 300ms ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [
    plugin(({ addVariant, addBase }) => {
      addVariant("children", "& > *");
      addBase({
        "@media print": {
          "@page": {
            margin: "1.5cm 1cm",
          },
        },
      });
    }),
  ],
};
