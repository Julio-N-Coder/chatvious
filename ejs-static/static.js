import express from "express";
import path from "path";
import cors from "cors";
const app = express();

app.use(cors());
app.use(express.static("../dist/public"));

app.get("/about", (req, res) => {
  res.sendFile(path.resolve("..", "dist", "public", "index.html"));
});

app.listen(8040, () => {
  console.log("Server is running on port 8040");
  console.log("url: http://localhost:8040");
});
