import express from "express";
import createRoom from "../controllers/rooms/createRoom.js";
import roomInfo from "../controllers/rooms/roomInfo.js";
import joinRoom from "../controllers/rooms/joinRoom.js";
import pageAuth from "../controllers/middleware/pageAuth.js";
import navUserInfo from "../controllers/middleware/userInfo.js";
const roomsRouter = express.Router();

roomsRouter.post("/createRoom", createRoom);

roomsRouter.post("/joinRoom", joinRoom);

roomsRouter.get("/:RoomID", pageAuth, navUserInfo, roomInfo);

export default roomsRouter;
