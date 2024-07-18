import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cognitoData from "../../cognitoData.js";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import { roomManger } from "../../models/rooms.js";
import { userManager } from "../../models/users.js";

// remove join_request from db and add them to members table as member status
export default async function acceptJoinRequest(req: Request, res: Response) {
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

  // verify if they are the owner or an admin of room.
  const userID = payload.sub;
  const { RoomID } = req.body as {
    RoomID: string | undefined;
  };
  const requestUserID = req.body.userID as string | undefined;

  if (!RoomID || !requestUserID) {
    res.status(400).json({ error: "Bad Request" });
    return;
  }

  const userInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    res.status(500).json({
      error:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }

  const userInfo = userInfoResponse.userInfo;
  const ownedRooms = userInfo.ownedRooms;
  const joinedRooms = userInfo.joinedRooms;
  let roomName = "";

  if (ownedRooms.length === 0 && joinedRooms.length === 0) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  let isOwner = false;
  userInfo.ownedRooms.forEach((room) => {
    if (room.RoomID === RoomID) {
      isOwner = true;
      roomName = room.roomName;
    }
  });

  let isAdmin = false;
  userInfo.joinedRooms.forEach((room) => {
    if (room.RoomID === RoomID) {
      if ("isAdmin" in room) {
        if (room.isAdmin) {
          isAdmin = true;
          roomName = room.roomName;
        }
      }
    }
  });

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // request user info
  const requestUserInfoResponse = await userManager.fetchUserInfo(
    requestUserID
  );
  if ("error" in requestUserInfoResponse) {
    res.status(500).json({
      error:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }
  const requestUserName = requestUserInfoResponse.userInfo.userName;
  const requestUserProfileColor = requestUserInfoResponse.userInfo.profileColor;

  const removeJoinRequestResponse = await roomManger.removeJoinRequest(
    RoomID,
    requestUserID
  );
  if ("error" in removeJoinRequestResponse) {
    res.status(removeJoinRequestResponse.statusCode).json({
      error: removeJoinRequestResponse.error,
    });
    return;
  }

  // add user as a member to room.
  const addMemberResponse = await roomManger.addRoomMember(
    RoomID,
    requestUserID,
    requestUserName,
    requestUserProfileColor
  );
  if ("error" in addMemberResponse) {
    res.status(addMemberResponse.statusCode).json({
      error: addMemberResponse.error,
    });
    return;
  }

  // update request user joined rooms.
  const updateJoinedRoomsResponse = await userManager.updateJoinedRooms(
    requestUserID,
    {
      RoomID,
      isAdmin: false,
      roomName,
    }
  );
  if ("error" in updateJoinedRoomsResponse) {
    res.status(updateJoinedRoomsResponse.statusCode).json({
      error: updateJoinedRoomsResponse.error,
    });
    return;
  }

  res.status(200).json({
    message: "Join request accepted",
  });
  return;
}
