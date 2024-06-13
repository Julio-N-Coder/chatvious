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
app.use(cookieParser());

app.get("/test", (req, res) => {
  res.render("test", { title: "Some text from node" });
});

// test URL http://localhost:3000/callback?code=a1b2c3d4-5678-90ab-cdef-EXAMPLE11111&state=abcdefg
app.get("/callback", callback);

app.get("/about", (req, res) => {
  console.log("Sending About Page");
  res.sendFile(path.resolve("dist", "public", "index.html"));
});

// add auth middle ware to validate tokens. tokens are in cookies "req.cookies.cookieName"
app.get("/dashboard", pageAuth, (req, res) => {
  console.log("Rendering Dashboard");
  // add check for prod to render actual signout domain
  res.render("dashboard");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
  console.log("URL: http://localhost:3000/");
});
