import express from "express";
import createRoom from "../controllers/rooms/createRoom.js";
import roomInfo from "../controllers/rooms/roomInfo.js";
import joinRoom from "../controllers/rooms/joinRoom.js";
import pageAuth from "../controllers/middleware/pageAuth.js";
const roomsRouter = express.Router();

roomsRouter.post("/createRoom", createRoom);

roomsRouter.post("/joinRoom", joinRoom);

roomsRouter.get("/:RoomID", pageAuth, roomInfo);

export default roomsRouter;
