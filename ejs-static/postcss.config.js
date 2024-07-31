import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const postcss = {
  plugins: [tailwindcss, autoprefixer],
};

if (process.env.NODE_ENV === "production") {
  postcss.plugins.splice(1, 0, cssnano);
}

export default postcss;
