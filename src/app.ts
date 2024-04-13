import express from "express";
import path from "path";
// import ejs from "ejs";
const app = express();

app.set("view engine", "ejs");
app.set("views", path.resolve("dist", "views"));

app.use(express.static(path.resolve("dist", "public")));

// This is to make other pages in spa react work
app.get("/*", (req, res) => {
  res.sendFile(path.resolve("dist", "public", "index.html"));
});

app.get("/test", (req, res) => {
  res.render("test", { title: "Some text from node" });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});

console.log("Test");
