import { Request, Response } from "express";
import { fetchRoom } from "../../models/rooms.js";

export default async function roomInfo(req: Request, res: Response) {
  const { RoomID } = req.params;
  // in fetchRoom, add check to see if user is owner. id should be on req.user.id
  const roomInfoResponse = await fetchRoom(RoomID);

  if (roomInfoResponse.error) {
    res
      .status(roomInfoResponse.statusCode)
      .json({ error: roomInfoResponse.error });
    return;
  }

  const { roomInfo } = roomInfoResponse;

  // make ejs page to and render this info. include the navbar as well
  console.log("rendering roomInfo page");
  res.status(200).json(roomInfo);
}
