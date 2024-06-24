import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import cognitoData from "../../cognitoData.js";
import { fetchRoom } from "../../models/rooms.js";
import { sendRoomRequest } from "../../models/users.js";

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

  const fetchRoomResponse = await fetchRoom(RoomID);
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
  const { roomInfo } = fetchRoomResponse;
  const { owner, roomName } = roomInfo;

  if (owner.ownerID === userID) {
    res.status(400).json({ error: "You are the owner of this room" });
    return;
  } else if (roomInfo.authedUsers.find((member) => member.userID === userID)) {
    res.status(400).json({ error: "You are already a member of this room" });
    return;
  }
  const notificationResponse = await sendRoomRequest(
    owner.ownerID,
    username,
    userID,
    roomName
  );

  if ("error" in notificationResponse) {
    res
      .status(notificationResponse.statusCode)
      .json({ error: notificationResponse.error });
    return;
  }

  res
    .status(notificationResponse.statusCode)
    .json({ message: notificationResponse.message });
}
