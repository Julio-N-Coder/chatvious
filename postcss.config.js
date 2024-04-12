import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

const postcss = {
  plugins: [tailwindcss, cssnano, autoprefixer],
};

// NODE_ENV doesn't work. try to make this work without using NODE_ENV
// if (process.env.NODE_ENV === "production") {
//   postcss.plugins.splice(1, 0, cssnano);
// }

export default postcss;
