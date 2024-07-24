import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  mode: "production",
  entry: {
    navBar: "./public/ts/navBar/navBar.ts",
    dashboard: "./public/ts/dashboard/script.ts",
    clientCreateRoom: "./public/ts/dashboard/clientRooms/clientCreateRoom.ts",
    clientJoinRoom: "./public/ts/dashboard/clientRooms/clientJoinRoom.ts",
    chatRoom: "./public/ts/chatRoom/chatRoom.ts",
    roomInfoJoinRequest: "./public/ts/roomInfoPage/roomInfoJoinRequest.ts",
    clientAcceptOrReject: "./public/ts/roomInfoPage/clientAcceptOrReject.ts",
    roomInfoKickUser: "./public/ts/roomInfoPage/roomInfoKickUser.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("..", "dist", "public", "ejs"),
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
    extensions: [".ts", ".js", "..."],
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
  },
};

export default config;
