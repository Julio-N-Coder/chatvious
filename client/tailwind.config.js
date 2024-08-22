/** @type {import('tailwindcss').Config} */
import daisyUI from "daisyui";

export default {
  content: ["./src/**/*.tsx", "./components/**/*.tsx"],
  theme: {
    extend: {
      screens: {
        xsm: "480px",
      },
    },
  },
  plugins: [daisyUI],
  daisyui: {
    themes: false,
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
