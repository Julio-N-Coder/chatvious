import express from "express";
import path from "path";
// import ejs from "ejs";
const app = express();

app.set("view engine", "ejs");
app.set("views", path.resolve("dist", "views"));

app.use(express.static(path.resolve("dist", "public")));

app.get("/test", (req, res) => {
  res.render("test", { title: "Some text from node" });
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});

console.log("Test");
