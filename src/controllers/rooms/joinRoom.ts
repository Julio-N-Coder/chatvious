import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import cognitoData from "../../cognitoData.js";
import { fetchRoom } from "../../models/rooms.js";

export default async function joinRoom(req: Request, res: Response) {
  if (!req.body.RoomID) {
    res.status(400).json("RoomID is required");
    return;
  } else if (typeof req.body.RoomID !== "string") {
    res.status(400).json("RoomID must be a string");
    return;
  }

  const access_token = req.cookies.access_token as string | undefined;
  if (!access_token) {
    res.status(401).json("Unauthorized");
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
    res.status(401).json("Unauthorized");
    return;
  }
  const id = access_token_payload.sub;
  const RoomID = req.body.RoomID as string;

  const fetchRoomResponse = await fetchRoom(RoomID);
  if ("error" in fetchRoomResponse) {
    res.status(fetchRoomResponse.statusCode).json(fetchRoomResponse.error);
    return;
  }
  const { roomInfo } = fetchRoomResponse;

  if (roomInfo.owner.ownerID === id) {
    res.status(400).json("You are the owner of this room");
    return;
  } else if (roomInfo.authedUsers.find((member) => member.userID === id)) {
    res.status(400).json("You are already a member of this room");
    return;
  }
  // need to send notification to owner to join (not set up yet)
  // another route will take care of adding user when owner allows it.

  res.json("Not finished");
}
