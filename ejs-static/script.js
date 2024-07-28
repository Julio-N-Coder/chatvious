import express from "express";
import path from "path";
const app = express();

app.use(express.static("../dist/public"));

app.get("/about", (req, res) => {
  res.sendFile(path.resolve("..", "dist", "public", "index.html"));
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
  console.log("url: http://localhost:8000");
});
