import express from "express";
import createRoom from "../controllers/rooms/createRoom.js";
import roomInfo from "../controllers/rooms/roomInfo.js";
import joinRoom from "../controllers/rooms/joinRoom.js";
import pageAuth from "../controllers/middleware/pageAuth.js";
import navUserInfo from "../controllers/middleware/userInfo.js";
import acceptJoinRequest from "../controllers/rooms/acceptJoinRequest.js";
import rejectJoinRequest from "../controllers/rooms/rejectJoinRequest.js";
import kickMember from "../controllers/rooms/kickMember.js";
const roomsRouter = express.Router();

roomsRouter.post("/createRoom", createRoom);

roomsRouter.post("/joinRoom", joinRoom);

roomsRouter.get("/:RoomID", pageAuth, navUserInfo, roomInfo);

roomsRouter.post("/acceptJoinRequest", acceptJoinRequest);

roomsRouter.post("/rejectJoinRequest", rejectJoinRequest);

roomsRouter.post("/kickMember", kickMember);

roomsRouter.post("/leaveRoom", (req, res) => {
  res.status(200).send("Left the room");
});

roomsRouter.post("/deleteRoom", (req, res) => {
  res.status(200).send("Deleted the room");
});

export default roomsRouter;
