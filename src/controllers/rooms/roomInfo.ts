import { Request, Response } from "express";
import {
  fetchRoom,
  fetchRoomMembers,
  fetchJoinRequests,
} from "../../models/rooms.js";
import { RoomsOnUser } from "../../types/types.js";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      navJoinRequests?: { RoomID: string; roomName: string }[] | [];
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

  // fetch RoomMembers to display
  const roomMembersResponse = await fetchRoomMembers(RoomID);
  if ("error" in roomMembersResponse) {
    res.status(roomMembersResponse.statusCode).json({
      error: "Failed to Render Page. I am sorry for the inconvenience.",
    });
    return;
  }

  const { roomMembers } = roomMembersResponse;
  let isAdmin = false;
  let isOwner = false;
  // can instead check by ownedRooms, joinedRooms on the user on req.user.
  roomMembers.find((member) => {
    if (member.userID === userID) {
      if (member.RoomUserStatus.startsWith("OWNER#")) {
        isOwner = true;
      } else if (member.RoomUserStatus.startsWith("ADMIN#")) {
        isAdmin = true;
      }
    }
  });

  const roomOwner = roomMembers.find((member) =>
    member.RoomUserStatus.startsWith("OWNER#")
  );
  if (roomOwner == undefined) {
    res.status(500).json({ error: "Room Owner not found" });
    return;
  }

  const { roomInfo } = roomInfoResponse;
  const { profileColor, username } = req.user;
  const navJoinRequest = req.user?.navJoinRequests;

  if (isOwner || isAdmin) {
    const joinRequestResponse = await fetchJoinRequests(RoomID);
    if ("error" in joinRequestResponse) {
      res
        .status(joinRequestResponse.statusCode)
        .json({ error: joinRequestResponse.error });
      return;
    }
    const { joinRequests } = joinRequestResponse;

    console.log("rendering roomInfo page", "Owner");
    res.render("roomInfo", {
      roomInfo,
      roomOwner,
      roomMembers,
      isOwnerOrAdmin: true,
      joinRequests,
      navJoinRequest,
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
    navJoinRequest,
    profileColor,
    username,
  });
}
