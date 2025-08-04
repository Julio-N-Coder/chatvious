import tailwindcss from "@tailwindcss/postcss";
import cssnano from "cssnano";

const postcss = {
  plugins: [
    tailwindcss,
    ...(process.env.NODE_ENV === "production" ? [cssnano()] : []),
  ],
};

export default postcss;
