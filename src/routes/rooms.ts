import express from "express";
import createRoom from "../controllers/rooms/createRoom.js";
import roomInfo from "../controllers/rooms/roomInfo.js";
import joinRoom from "../controllers/rooms/joinRoom.js";
import pageAuth from "../controllers/middleware/pageAuth.js";
import get5JoinRequest from "../controllers/middleware/joinRequest.js";
import navUserInfo from "../controllers/middleware/userInfo.js";
const roomsRouter = express.Router();

roomsRouter.post("/createRoom", createRoom);

roomsRouter.post("/joinRoom", joinRoom);

// if they are owner, also get joinRoomRequest to display all request
roomsRouter.get("/:RoomID", pageAuth, navUserInfo, get5JoinRequest, roomInfo);

export default roomsRouter;
