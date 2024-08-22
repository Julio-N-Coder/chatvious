import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack from "webpack";

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
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
    promoteOrDemoteUser: "./public/ts/roomInfoPage/promoteOrDemoteUser.ts",
    profilePage: "./public/ts/profilePage/profilePage.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve("..", "dist", "public", "ejs"),
    clean: {
      keep: /^ejs(\.min)?\.js$/,
    },
  },
  devServer: {
    static: "../dist/public",
    open: false,
    port: 8040,
    historyApiFallback: true,
  },
  devtool: "inline-source-map",
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles.css",
    }),
    new webpack.DefinePlugin({
      "process.env.IS_DEV_SERVER": JSON.stringify(true),
      "process.env.DOMAIN": JSON.stringify("localhost"),
      "process.env.DOMAIN_URL": JSON.stringify("http://localhost:3000"),
      "process.env.SUB_DOMAIN": JSON.stringify("localhost"),
      "process.env.SUB_DOMAIN_URL": JSON.stringify("http://localhost:8040"),
      "process.env.USER_POOL_ID": JSON.stringify("us-west-1_gmrxTddmt"),
      "process.env.USER_POOL_CLIENT_ID": JSON.stringify(
        "2ot92gv0u6sivjbonnl13m487r"
      ),
      "process.env.COGNITO_DOMAIN_URL": JSON.stringify(
        "https://chatvious.auth.us-west-1.amazoncognito.com"
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

export default () => {
  if (isProduction) {
    console.log("Production mode");
    config.mode = "production";
  } else {
    console.log("Development mode");
    config.mode = "development";
  }
  return config;
};
