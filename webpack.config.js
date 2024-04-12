import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  entry: "./src/public/ts/script.ts",
  output: {
    // filename: "[name].js",
    path: path.resolve("dist", "public", "ejs"),
    clean: true,
  },
  devtool: "inline-source-map",
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css", // not dynamic if css file name changes.
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader", "postcss-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
  },
  optimization: {
    runtimeChunk: "single",
  },
};

export default () => {
  if (isProduction) {
    config.mode = "production";
    delete config.devtool;
  } else {
    config.mode = "development";
  }
  return config;
};
