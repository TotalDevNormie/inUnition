/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["app/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  plugins: [],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      text: "#eaf2f0",
      background: {
        DEFAULT: "#121616",
        100: "#171C1C",
        200: "#222A2AS",
      },
      primary: "#2cc2a4",
      secondary: "#36455c",
      accent: "#9ea0cc",
    },
  },
};