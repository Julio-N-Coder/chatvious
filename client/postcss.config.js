import tailwindcss from "@tailwindcss/postcss";
import cssnano from "cssnano";

const postcss = {
  // Add you postcss configuration here
  // Learn more about it at https://github.com/webpack-contrib/postcss-loader#config-files
  plugins: [
    tailwindcss,
    ...(process.env.NODE_ENV === "production" ? [cssnano()] : []),
  ],
};

export default postcss;
