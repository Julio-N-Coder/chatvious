import "dotenv/config";
import express from "express";
import path from "path";
import { callback } from "./controllers/callback.js";
import { isProduction } from "./lib/handyUtils.js";
import cookieParser from "cookie-parser";
import pageAuth from "./controllers/middleware/pageAuth.js";
const app = express();

app.set("view engine", "ejs");

if (isProduction()) {
  app.set("views", path.resolve("dist", "views"));
} else {
  app.set("views", path.resolve("src", "views"));
}

app.use(express.static(path.resolve("dist", "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// test URL http://localhost:3000/callback?code=a1b2c3d4-5678-90ab-cdef-EXAMPLE11111&state=abcdefg
app.get("/callback", callback);

app.get("/about", (req, res) => {
  console.log("Sending About Page");
  res.sendFile(path.resolve("dist", "public", "index.html"));
});

// add middleware to fetch room data to render to ui. add data to req object.
app.get("/dashboard", pageAuth, (req, res) => {
  console.log("Rendering Dashboard");
  // add check for prod to render actual signout domain
  res.render("dashboard");
});

app.get("/createRoom", (req, res) => {
  console.log("Making Create Room");
  res.send("createRoom");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
  console.log("URL: http://localhost:3000/");
});
