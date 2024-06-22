import { Request, Response } from "express";
import { makeRoom } from "../../models/rooms.js";

async function createRoom(req: Request, res: Response) {
  console.log("Making Create Room");
  if (!req.body.roomName) {
    res.status(400).json({ error: "Room Name is required" });
    return;
  }
  if (typeof req.body.roomName !== "string") {
    res.status(400).json({ error: "Room Name must be a string" });
    return;
  }
  if (req.body.roomName.length < 3) {
    res.status(400).json({ error: "Room Name must be at least 3 characters" });
    return;
  }
  if (req.body.roomName.length > 25) {
    res
      .status(400)
      .json({ error: "Room Name must be less than 25 characters" });
    return;
  }

  const makeRoomResponse = await makeRoom(req);
  if ("error" in makeRoomResponse) {
    res
      .status(makeRoomResponse.statusCode)
      .json({ error: makeRoomResponse.error });
    return;
  }

  return res.status(201).json({ message: makeRoomResponse.message });
}

export default createRoom;
