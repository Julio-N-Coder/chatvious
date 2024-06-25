import { Request, Response } from "express";
import { fetchRoom } from "../../models/rooms.js";
import { JoinRequets } from "../../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      anyJoinRequest?: boolean;
      first5JoinRequest?: JoinRequets;
      username?: string;
      profileColor?: string;
    };
  }
}

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
  const { anyJoinRequest, first5JoinRequest, profileColor, username } =
    req.user;
  console.log(profileColor);

  // if they are owner, also get joinRoomRequest to display
  if (roomInfo.owner.ownerID === userID) {
    console.log("rendering roomInfo page", "Onwer");
    res.render("roomInfo", {
      roomInfo,
      isOwner: true,
      anyJoinRequest,
      first5JoinRequest,
      profileColor,
      username,
    });
    return;
  }

  console.log("rendering roomInfo page");
  res.render("roomInfo", {
    roomInfo,
    isOwner: false,
    anyJoinRequest,
    first5JoinRequest,
    profileColor,
    username,
  });
}
