import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import {
  fakeDashboardData,
  ownedRoomInfo,
  joinedRoomInfo,
  fakeJoinRoomInfoPage,
  joinedRoomAdminInfo,
  fakeJoinRoomInfoPageOwner,
  fakeJoinRoomInfoPageAdmin,
  fakeJoinRoomInfoPageMember,
  fakeChatRoomOwnerData,
  fakeChatRoomMemberData,
  fakeProfilePageData,
} from "./fakeEjsPageData.js";
const app = express();

app.set("view engine", "ejs");

app.get("/dashboard", (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "dashboard"),
    fakeDashboardData
  );
});

app.get(`/rooms/${ownedRoomInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "roomInfo"),
    fakeJoinRoomInfoPageOwner
  );
});

app.get(`/rooms/${joinedRoomInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "roomInfo"),
    fakeJoinRoomInfoPageMember
  );
});

app.get(`/rooms/${joinedRoomAdminInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "roomInfo"),
    fakeJoinRoomInfoPageAdmin
  );
});

app.get("/rooms/randomRoom", (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "roomInfo"),
    fakeJoinRoomInfoPage
  );
});

app.get(`/chat-room/${ownedRoomInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "chatRoom"),
    fakeChatRoomOwnerData
  );
});

app.get(`/chat-room/${joinedRoomInfo.RoomID}`, (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "chatRoom"),
    fakeChatRoomMemberData
  );
});

app.get("/user/profilePage", (req, res) => {
  res.render(
    path.resolve("..", "serverless-aws-sam", "src", "views", "profilePage"),
    fakeProfilePageData
  );
});

const cert = fs.readFileSync(path.resolve("..", "certs/chatvious-cert.pem"));
const key = fs.readFileSync(path.resolve("..", "certs/chatvious-cert-key.pem"));

https.createServer({ key, cert }, app).listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log("url: http://main.localhost:3000");
});
