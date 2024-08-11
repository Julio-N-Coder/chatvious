import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";

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
    leaveRoom: "./public/ts/roomInfoPage/leaveRoom.ts",
    deleteRoom: "./public/ts/roomInfoPage/deleteRoom.ts",
    promoteUser: "./public/ts/roomInfoPage/promoteUser.ts",
    demoteUser: "./public/ts/roomInfoPage/demoteUser.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("..", "dist", "public", "ejs"),
    clean: {
      keep: /^ejs\.min\.js$/,
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
    new webpack.DefinePlugin({
      "process.env.IS_DEV_SERVER": JSON.stringify(false),
      "process.env.DOMAIN": JSON.stringify("chatvious.coding-wielder.com"),
      "process.env.DOMAIN_URL": JSON.stringify(
        "https://chatvious.coding-wielder.com/main"
      ),
      "process.env.SUB_DOMAIN": JSON.stringify(
        "main.chatvious.coding-wielder.com"
      ),
      "process.env.SUB_DOMAIN_URL": JSON.stringify(
        "https://main.chatvious.coding-wielder.com"
      ),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts?$/,
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
      {
        test: /\.ejs$/,
        type: "asset/source",
        include: [
          path.resolve("../serverless-aws-sam/src/views/components/chatRoom"),
        ],
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
