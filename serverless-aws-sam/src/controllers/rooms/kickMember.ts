import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import cognitoData from "../../cognitoData.js";
import { roomManger } from "../../models/rooms.js";
import { userManager } from "../../models/users.js";

export default async function kickMember(req: Request, res: Response) {
  const access_token = req.cookies.access_token as string | undefined;
  if (!access_token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const verifier = CognitoJwtVerifier.create({
    userPoolId: cognitoData.USER_POOL_ID,
    tokenUse: "access",
    clientId: cognitoData.CLIENT_ID,
  });

  let payload: CognitoAccessTokenPayload;
  try {
    payload = await verifier.verify(access_token);
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userID = payload.sub;
  const memberUserID = req.body.userID as string | undefined;
  const RoomID = req.body.RoomID as string | undefined;

  if (memberUserID == undefined || RoomID == undefined) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  const fetchRoomMemberResponse = await roomManger.fetchRoomMember(
    RoomID,
    userID
  );
  if ("error" in fetchRoomMemberResponse) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { RoomUserStatus } = fetchRoomMemberResponse.roomMember;
  if (!(RoomUserStatus === "OWNER") && !(RoomUserStatus === "ADMIN")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // check whether user is a lower status then kicker
  const memberUserInfo = await roomManger.fetchRoomMember(RoomID, memberUserID);
  if ("error" in memberUserInfo) {
    res.status(404).json({ error: "Forbidden" });
    return;
  }

  const { RoomUserStatus: memberUserStatus } = memberUserInfo.roomMember;

  if (RoomUserStatus === "OWNER") {
    if (memberUserStatus === "OWNER") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  } else if (RoomUserStatus === "ADMIN") {
    if (memberUserStatus === "OWNER" || memberUserStatus === "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const removeRoomMemberResponse = roomManger.removeRoomMember(
    RoomID,
    memberUserID
  );
  if ("error" in removeRoomMemberResponse) {
    res.status(400).json({ error: removeRoomMemberResponse.error });
    return;
  }

  // remove joinedRooms on kicked user.
  const removeJoinedRoomResponse = userManager.removeJoinedRoom(
    memberUserID,
    RoomID
  );
  if ("error" in removeJoinedRoomResponse) {
    res.status(400).json({ error: removeJoinedRoomResponse.error });
    return;
  }

  res.status(200).json({ message: "User Successfully Kicked" });
}
