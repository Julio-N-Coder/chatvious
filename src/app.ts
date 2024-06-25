import "dotenv/config";
import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import socket_io_server from "./socketServer.js";
import { callback } from "./controllers/callback.js";
import { isProduction } from "./lib/handyUtils.js";
import cookieParser from "cookie-parser";
import pageAuth from "./controllers/middleware/pageAuth.js";
import dashboard from "./controllers/dashboard.js";
import get5JoinRequest from "./controllers/middleware/joinRequest.js";
import roomsRouter from "./routes/rooms.js";

const app = express();
const server = createServer(app);
const io = new Server(server);
socket_io_server(io);

app.set("view engine", "ejs");

if (isProduction()) {
  app.set("views", path.resolve("dist", "views"));
} else {
  app.set("views", path.resolve("src", "views"));
}

app.use(express.static(path.resolve("dist", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/rooms", roomsRouter);

app.get("/callback", callback);

app.get("/about", (req, res) => {
  console.log("Sending About Page");
  res.sendFile(path.resolve("dist", "public", "index.html"));
});

app.get("/dashboard", pageAuth, get5JoinRequest, dashboard);

app.get("/chat-room/:RoomID", (req, res) => {
  console.log("rendering chatroom page");
  res.render("chatRoom");
});

server.listen(3000, () => {
  console.log("Listening on port 3000");
  console.log("URL: http://localhost:3000/");
});
