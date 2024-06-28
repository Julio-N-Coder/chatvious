import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import cognitoData from "../../cognitoData.js";
import { makeRoom } from "../../models/rooms.js";
import { fetchUserInfo } from "../../models/users.js";

async function createRoom(req: Request, res: Response) {
  console.log("Making Create Room");
  if (!req.body.roomName) {
    res.status(400).json({ error: "Room Name is required" });
    return;
  }
  if (typeof req.body.roomName !== "string") {
    res.status(400).json({ error: "Room Name must be a string" });
    return;
  }
  if (req.body.roomName.length < 3) {
    res.status(400).json({ error: "Room Name must be at least 3 characters" });
    return;
  }
  if (req.body.roomName.length > 25) {
    res
      .status(400)
      .json({ error: "Room Name must be less than 25 characters" });
    return;
  }

  const verifier = CognitoJwtVerifier.create({
    userPoolId: cognitoData.USER_POOL_ID,
    tokenUse: "access",
    clientId: cognitoData.CLIENT_ID,
  });

  const access_token = req.cookies.access_token as string | undefined;
  if (!access_token) {
    return { error: "Unauthorized", statusCode: 401 };
  }

  let payload: CognitoAccessTokenPayload;
  try {
    payload = await verifier.verify(access_token);
  } catch (err) {
    return { error: "Unauthorized", statusCode: 401 };
  }

  const userID = payload.sub;
  const userName = payload.username;
  const roomName = req.body.roomName as string;

  const userInfoResponse = await fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    res
      .status(userInfoResponse.statusCode)
      .json({ error: userInfoResponse.error });
    return;
  }

  const { profileColor } = userInfoResponse.userInfo;

  const makeRoomResponse = await makeRoom(
    userID,
    userName,
    roomName,
    profileColor
  );
  if ("error" in makeRoomResponse) {
    res
      .status(makeRoomResponse.statusCode)
      .json({ error: makeRoomResponse.error });
    return;
  }

  return res.status(201).json({ message: makeRoomResponse.message });
}

export default createRoom;
