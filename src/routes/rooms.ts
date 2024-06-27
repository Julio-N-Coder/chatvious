import express from "express";
import createRoom from "../controllers/rooms/createRoom.js";
import roomInfo from "../controllers/rooms/roomInfo.js";
import joinRoom from "../controllers/rooms/joinRoom.js";
import pageAuth from "../controllers/middleware/pageAuth.js";
import navUserInfo from "../controllers/middleware/userInfo.js";
const roomsRouter = express.Router();

roomsRouter.post("/createRoom", createRoom);

roomsRouter.post("/joinRoom", joinRoom);

// if they are owner, also get joinRoomRequest to display all request
// also display to room id for users to request to join the room by it.
// also just check on the server whether a user is part of the room and display a button to request to join.
roomsRouter.get("/:RoomID", pageAuth, navUserInfo, roomInfo);

export default roomsRouter;
