/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      backgroundColor: {
        "custom-red": "#FE0000",
      },
      animation: {
        shimmer: "shimmer 2s infinite",
      },
      textColor: {
        "custom-red": "#FE0000",
      },
      fontFamily: {
        oswald: ["Oswald", "sans-serif"],
        antonio: ["Antonio", "sans-serif"],
        koch: ["Koch Fette Deutsche Schrift", "sans-serif"],
        coolvetica: ["Coolvetica", "sans-serif"],
        "coolvetica-compressed": ["Coolvetica Compressed", "sans-serif"],
        "coolvetica-condensed": ["Coolvetica Condensed", "sans-serif"],
        "coolvetica-crammed": ["Coolvetica Crammed", "sans-serif"],
        "coolvetica-ul": ["Coolvetica Ul", "sans-serif"],
      },
      fontWeight: {
        thin: "200",
        light: "300",
        normal: "400",
        medium: "500",
        bold: "700",
        black: "900",
      },
      screens: {
        random: "463px",
      },
      colors: {
        "blue-apm": "#396FB7",
      },
      keyframes: {
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
    },
  },
  plugins: [],
};
