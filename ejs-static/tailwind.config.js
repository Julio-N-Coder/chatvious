/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";

export default {
  content: [
    "../serverless-aws-sam/src/views/**/*.ejs",
    "./public/client-ejs/**/*.ejs",
  ],
  safelist: [
    {
      pattern: /bg-(blue|green|orange|yellow|sky|purple|pink)-500/,
    },
    "bg-error",
    "text-error-content",
    "bg-success",
    "text-success-content",
  ],
  theme: {
    extend: {
      screens: {
        xsm: "480px",
        mdsm: "580px",
      },
    },
  },
  plugins: [daisyui],
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
