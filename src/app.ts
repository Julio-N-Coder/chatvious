import "dotenv/config";
import express from "express";
import path from "path";
import { callback } from "./controllers/callback.js";
// import ejs from "ejs";
const app = express();

app.set("view engine", "ejs");
app.set("views", path.resolve("dist", "views"));

app.use(express.static(path.resolve("dist", "public")));

app.get("/test", (req, res) => {
  res.render("test", { title: "Some text from node" });
});

// test URL http://localhost:3000/callback?code=a1b2c3d4-5678-90ab-cdef-EXAMPLE11111&state=abcdefg
// getting tokens works. Need to get them from url in browser and store them. then try to remove url queries if can.
app.get("/callback", callback);

app.get("/about", (req, res) => {
  console.log("Sending About Page");
  res.sendFile(path.resolve("dist", "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  console.log("Rendering Dashboard");
  res.render("dashboard");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
  console.log("URL: http://localhost:3000/");
});
