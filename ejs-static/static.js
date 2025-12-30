import express from "express";
import https from "https";
import fs from "fs";
import path from "path";
import cors from "cors";
const app = express();

const cert = fs.readFileSync(path.resolve("..", "certs/chatvious-cert.pem"));
const key = fs.readFileSync(path.resolve("..", "certs/chatvious-cert-key.pem"));

app.use(cors());
app.use(express.static("../dist/public"));

app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.resolve("..", "dist", "public", "index.html"));
});

https.createServer({ key, cert }, app).listen(8040, () => {
  console.log("Server is running on port 8040");
  console.log("HTTPS static server running on https://sub.main.localhost:8040");
});
