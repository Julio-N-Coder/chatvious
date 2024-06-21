import { Request, Response } from "express";
import { makeRoom } from "../../models/rooms.js";

async function createRoom(req: Request, res: Response) {
  console.log("Making Create Room");
  if (req.body.roomName === "") {
    res.status(400).json({ error: "Room Name is required" });
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
  if (makeRoomResponse.errorMessage) {
    res
      .status(makeRoomResponse.statusCode)
      .json({ error: makeRoomResponse.errorMessage });
    return;
  } else if (makeRoomResponse.error) {
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }

  return res.status(201).json({ message: "Data Created successfully" });
}

export default createRoom;
