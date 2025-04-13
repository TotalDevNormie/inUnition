/** @type {import('tailwindcss').Config} */
import { platformSelect } from "nativewind/theme";

module.exports = {
  darkMode: "class",
  content: ["app/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  plugins: [],
  theme: {
    colors: {
      ...require("tailwindcss/colors"),
      transparent: "transparent",
      current: "currentColor",
      text: {
        DEFAULT: "#E9F1EF",
        50: "#eff5f4",
        100: "#e0ebe8",
        200: "#c1d7d2",
        300: "#a2c3bb",
        400: "#83afa4",
        500: "#639c8e",
        600: "#507c71",
        700: "#3c5d55",
        800: "#283e39",
        900: "#141f1c",
        950: "#0a100e",
      },
      background: {
        DEFAULT: "#121517",
        50: "#f1f3f4",
        100: "#e2e6e9",
        200: "#c6cdd2",
        300: "#a9b4bc",
        400: "#8d9ba5",
        500: "#70838f",
        600: "#5a6872",
        700: "#434e56",
        800: "#2d3439",
        900: "#161a1d",
        950: "#0b0d0e",
      },
      primary: {
        DEFAULT: "#2CC3A5",
        50: "#eafaf7",
        100: "#d5f6ef",
        200: "#acecdf",
        300: "#82e3cf",
        400: "#59d9c0",
        500: "#2fd0b0",
        600: "#26a68d",
        700: "#1c7d69",
        800: "#135346",
        900: "#092a23",
        950: "#051512",
      },
      secondary: {
        DEFAULT: "#313749",
        50: "#f0f1f5",
        100: "#e0e3eb",
        200: "#c2c7d6",
        300: "#a3abc2",
        400: "#858fad",
        500: "#667399",
        600: "#525c7a",
        700: "#3d455c",
        800: "#292e3d",
        850: "#1f222e",
        900: "#14171f",
        950: "#0a0b0f",
      },
      accent: {
        DEFAULT: "#B2B3EB",
        50: "#ebebfa",
        100: "#d6d7f5",
        200: "#aeafea",
        300: "#8587e0",
        400: "#5d5fd5",
        500: "#3437cb",
        600: "#2a2ca2",
        700: "#1f217a",
        800: "#151651",
        900: "#0a0b29",
        950: "#050514",
      },
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.5rem", { lineHeight: "2rem" }],
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      "5xl": ["3rem", { lineHeight: "1" }],
      "6xl": ["3.75rem", { lineHeight: "1" }],
      "7xl": ["4.5rem", { lineHeight: "1" }],
      "8xl": ["6rem", { lineHeight: "1" }],
      "9xl": ["8rem", { lineHeight: "1" }],
    },
  },
};
