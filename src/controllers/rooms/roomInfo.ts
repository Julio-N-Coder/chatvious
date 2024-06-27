import { Request, Response } from "express";
import {
  fetchRoom,
  fetchRoomOwner,
  fetchRoomMembers,
  fetchJoinRequests,
} from "../../models/rooms.js";
import { RoomsOnUser } from "../../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      // first5JoinRequest?: JoinRequets;
      ownedRooms?: RoomsOnUser;
      joinedRooms?: RoomsOnUser;
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

  const roomOwnerResponse = await fetchRoomOwner(RoomID);
  if ("error" in roomOwnerResponse) {
    res
      .status(roomOwnerResponse.statusCode)
      .json({ error: roomOwnerResponse.error });
    return;
  }

  // fetch RoomMembers to display
  const roomMembersResponse = await fetchRoomMembers(RoomID);
  if ("error" in roomMembersResponse) {
    res.status(roomMembersResponse.statusCode).json({
      error: "Failed to Render Page. I am sorry for the inconvenience.",
    });
    return;
  }

  const { roomMembers } = roomMembersResponse;
  // I need to check whether they are admin.
  let isAdmin = false;
  roomMembers.find((member) => {
    if (member.userID === userID) {
      if (member.isAdmin) {
        isAdmin = true;
      }
    }
  });

  const { roomInfo } = roomInfoResponse;
  const { roomOwner } = roomOwnerResponse;
  const { profileColor, username } = req.user;
  // if they are owner, also get joinRoomRequest to display
  if (roomOwner.ownerID === userID || isAdmin) {
    // fetch join request to display.
    const joinRequestResponse = await fetchJoinRequests(RoomID);
    if ("error" in joinRequestResponse) {
      res
        .status(joinRequestResponse.statusCode)
        .json({ error: joinRequestResponse.error });
      return;
    }
    const { joinRequests } = joinRequestResponse;

    console.log("rendering roomInfo page", "Onwer");
    res.render("roomInfo", {
      roomInfo,
      roomOwner,
      roomMembers,
      isOwnerOrAdmin: true,
      joinRequests,
      first5JoinRequest: [],
      profileColor,
      username,
    });
    return;
  }

  console.log("rendering roomInfo page");
  res.render("roomInfo", {
    roomInfo,
    roomOwner,
    roomMembers,
    isOwnerOrAdmin: false,
    first5JoinRequest: [],
    profileColor,
    username,
  });
}
