import { Request, Response } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cognitoData from "../../cognitoData.js";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import {
  removeJoinRequest,
  addRoomMember,
  fetchRoomMember,
} from "../../models/rooms.js";
import { fetchUserInfo } from "../../models/users.js";

// remove join_request from db and add them to members table as member status
export default async function acceptJoinRequest(req: Request, res: Response) {
  const access_token = req.cookies.access_token as string | undefined;
  if (!access_token) {
    res.status(401).send("Unauthorized");
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
    res.status(401).send("Unauthorized");
    return;
  }

  // verify if they are the owner or a admin of room.
  const userID = payload.sub;
  const { RoomID, sentJoinRequestAt } = req.body as {
    RoomID: string | undefined;
    sentJoinRequestAt: string | undefined;
  };
  const requestUserID = req.body.userID as string | undefined;

  if (!RoomID || !sentJoinRequestAt || !requestUserID) {
    res.status(400).send("Bad Request");
    return;
  }

  const userInfoResponse = await fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    res.status(500).send({
      message:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }

  const userInfo = userInfoResponse.userInfo;
  const ownedRooms = userInfo.ownedRooms;
  const joinedRooms = userInfo.joinedRooms;

  if (ownedRooms.length === 0 && joinedRooms.length === 0) {
    res.status(403).send("Forbidden");
    return;
  }

  let isOwner = false;
  userInfo.ownedRooms.forEach((room) => {
    if (room.RoomID === RoomID) {
      isOwner = true;
    }
  });

  let isAdmin = false;
  userInfo.joinedRooms.forEach((room) => {
    if (room.RoomID === RoomID) {
      if ("isAdmin" in room) {
        if (room.isAdmin) {
          isAdmin = true;
        }
      }
    }
  });

  if (!isOwner) {
    if (!isAdmin) {
      res.status(403).send("Forbidden");
      return;
    }
  }

  // check whether request user is already a part of the room
  // not set up yet.
  // const isMemberResponse = await fetchRoomMember(RoomID, requestUserID);

  const removeJoinRequestResponse = await removeJoinRequest(
    RoomID,
    sentJoinRequestAt,
    requestUserID
  );
  if ("error" in removeJoinRequestResponse) {
    res.status(removeJoinRequestResponse.statusCode).send({
      message: removeJoinRequestResponse.error,
    });
    return;
  }

  // request user info
  const requestUserInfoResponse = await fetchUserInfo(requestUserID);
  if ("error" in requestUserInfoResponse) {
    res.status(500).send({
      message:
        "We're sorry for the inconviencence, there seems to be a problem with our servers",
    });
    return;
  }
  const requestUserName = requestUserInfoResponse.userInfo.userName;
  const requestUserProfileColor = requestUserInfoResponse.userInfo.profileColor;

  // add user as a member to room.
  const addMemberResponse = await addRoomMember(
    RoomID,
    requestUserID,
    requestUserName,
    requestUserProfileColor
  );
  if ("error" in addMemberResponse) {
    res.status(addMemberResponse.statusCode).send({
      message: addMemberResponse.error,
    });
    return;
  }

  res.status(200).send({
    message: "Join request accepted",
  });
  return;
}
