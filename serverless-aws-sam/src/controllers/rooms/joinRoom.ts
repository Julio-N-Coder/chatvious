import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import cognitoData from "../../cognitoData.js";
import { roomManger } from "../../models/rooms.js";
import { userManager } from "../../models/users.js";

export default async function joinRoom(req: Request, res: Response) {
  if (!req.body.RoomID) {
    res.status(400).json({ error: "RoomID is required" });
    return;
  } else if (typeof req.body.RoomID !== "string") {
    res.status(400).json({ error: "RoomID must be a string" });
    return;
  }

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

  let access_token_payload: CognitoAccessTokenPayload;
  try {
    access_token_payload = await verifier.verify(access_token);
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { sub: userID, username } = access_token_payload;
  const RoomID = req.body.RoomID as string;

  const fetchRoomResponse = await roomManger.fetchRoom(RoomID);
  if ("error" in fetchRoomResponse) {
    if (fetchRoomResponse.error === "Bad Request") {
      res
        .status(fetchRoomResponse.statusCode)
        .json({ error: "Invalid RoomID" });
      return;
    }

    res
      .status(fetchRoomResponse.statusCode)
      .json({ error: fetchRoomResponse.error });
    return;
  }

  const roomMembersResponse = await roomManger.fetchRoomMembers(RoomID);
  if ("error" in roomMembersResponse) {
    res
      .status(roomMembersResponse.statusCode)
      .json({ error: roomMembersResponse.error });
    return;
  }

  const { roomName } = fetchRoomResponse.roomInfo;
  const { roomMembers } = roomMembersResponse;

  if (roomMembers.find((member) => member.userID === userID)) {
    res.status(400).json({ error: "You are already a member of this room" });
    return;
  }

  // change below to just fetch by user id
  const joinRequestResponse = await roomManger.fetchJoinRequest(RoomID, userID);
  if (
    "error" in joinRequestResponse &&
    joinRequestResponse.error !== "Bad Request"
  ) {
    res
      .status(joinRequestResponse.statusCode)
      .json({ error: joinRequestResponse.error });
    return;
  }

  if (joinRequestResponse.statusCode === 200) {
    res.status(403).json({ error: "You have already sent a join Request" });
  }

  // fetch user info for profile colour
  const userInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    res
      .status(userInfoResponse.statusCode)
      .json({ error: userInfoResponse.error });
    return;
  }
  const { profileColor } = userInfoResponse.userInfo;

  // send a join request to the room.
  const joinRequest = await roomManger.sendJoinRequest(
    username,
    userID,
    roomName,
    RoomID,
    profileColor
  );
  if ("error" in joinRequest) {
    res.status(joinRequest.statusCode).json({ error: joinRequest.error });
    return;
  }

  console.log("Sent Join Request");
  res.status(joinRequest.statusCode).json({ message: joinRequest.message });
}
