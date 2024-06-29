import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import cognitoData from "../../cognitoData.js";
import { fetchRoomMember, removeJoinRequest } from "../../models/rooms.js";

export default async function rejectJoinRequest(req: Request, res: Response) {
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
  const RoomID = req.body.RoomID as string | undefined;
  const requestUserID = req.body.userID as string | undefined;
  const sentJoinRequestAt = req.body.sentJoinRequestAt as string | undefined;

  if (!RoomID) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }
  if (!requestUserID) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }
  if (!sentJoinRequestAt) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  const roomMemberResponse = await fetchRoomMember(RoomID, userID);
  if ("error" in roomMemberResponse) {
    res.status(roomMemberResponse.statusCode).json({
      error: roomMemberResponse.error,
    });
    return;
  }

  const { RoomUserStatus } = roomMemberResponse.roomMember;

  if (RoomUserStatus !== "OWNER" && RoomUserStatus !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const removeJoinRequestResponse = await removeJoinRequest(
    RoomID,
    sentJoinRequestAt,
    requestUserID
  );
  if ("error" in removeJoinRequestResponse) {
    res.status(removeJoinRequestResponse.statusCode).json({
      error: removeJoinRequestResponse.error,
    });
    return;
  }

  res.status(200).json({
    message: "Join request rejected successfully",
  });
}
