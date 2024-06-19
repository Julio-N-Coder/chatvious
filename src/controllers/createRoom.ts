import { Request, Response } from "express";

async function createRoom(req: Request, res: Response) {
  console.log("Making Create Room");
  // try to make room
  // if there is a problem, send status problem, else send status 201

  if (req.body.roomName === "") {
    res.status(400).json({ error: "Room Name is required" });
    return;
  }

  res.status(201).json({ test: "Test Value" });
}

export default createRoom;
