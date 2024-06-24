import { Request, Response } from "express";
import { fetchRoom } from "../../models/rooms.js";

export default async function roomInfo(req: Request, res: Response) {
  const { RoomID } = req.params;
  if (req.user == undefined) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userID = req.user.id;
  const roomInfoResponse = await fetchRoom(RoomID);

  if ("error" in roomInfoResponse) {
    res
      .status(roomInfoResponse.statusCode)
      .json({ error: roomInfoResponse.error });
    return;
  }

  const { roomInfo } = roomInfoResponse;

  // if they are owner, also get joinRoomRequest to display
  if (roomInfo.owner.ownerID === userID) {
    console.log("rendering roomInfo page", "Onwer");
    res.render("roomInfo", { roomInfo, isOwner: true });
    return;
  }

  console.log("rendering roomInfo page");
  res.render("roomInfo", { roomInfo, isOwner: false });
}
