import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManger } from "../../models/rooms.js";
import { userManager } from "../../models/users.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }
  const RoomID = bodyValidation.body.RoomID;
  const requestUserID = bodyValidation.body.userID;

  const userID = event.requestContext.authorizer?.claims.sub as string;

  const userInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 500,
      body: JSON.stringify({
        error:
          "We're sorry for the inconviencence, there seems to be a problem with our servers",
      }),
    };
  }

  const userInfo = userInfoResponse.userInfo;
  const ownedRooms = userInfo.ownedRooms;
  const joinedRooms = userInfo.joinedRooms;
  let roomName = "";

  // verify if they are the owner or an admin of room.
  if (ownedRooms.length === 0 && joinedRooms.length === 0) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
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
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  // request user info
  const requestUserInfoResponse = await userManager.fetchUserInfo(
    requestUserID
  );
  if ("error" in requestUserInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 500,
      body: JSON.stringify({
        error:
          "We're sorry for the inconviencence, there seems to be a problem with our servers",
      }),
    };
  }
  const requestUserName = requestUserInfoResponse.userInfo.userName;
  const requestUserProfileColor = requestUserInfoResponse.userInfo.profileColor;

  const removeJoinRequestResponse = await roomManger.removeJoinRequest(
    RoomID,
    requestUserID
  );
  if ("error" in removeJoinRequestResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: removeJoinRequestResponse.statusCode,
      body: JSON.stringify({ error: removeJoinRequestResponse.error }),
    };
  }

  // add user as a member to room.
  const addMemberResponse = await roomManger.addRoomMember(
    RoomID,
    requestUserID,
    requestUserName,
    requestUserProfileColor
  );
  if ("error" in addMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: addMemberResponse.statusCode,
      body: JSON.stringify({ error: addMemberResponse.error }),
    };
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
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: updateJoinedRoomsResponse.statusCode,
      body: JSON.stringify({ error: updateJoinedRoomsResponse.error }),
    };
  }

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({ message: "Join request accepted successfully" }),
  };
}

function validateBody(
  event: APIGatewayEvent
): APIGatewayProxyResult | { body: { userID: string; RoomID: string } } {
  function standardError(error: string): APIGatewayProxyResult {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({ error }),
    };
  }

  if (event.headers["Content-Type"] !== "application/json") {
    return standardError("Invalid Content Type");
  }
  if (!event.body) {
    return standardError("Bad Request");
  }

  let parsedBody: { userID?: string; RoomID?: string };
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    return standardError("Invalid JSON");
  }
  if (!parsedBody.RoomID || !parsedBody.userID) {
    return standardError("Bad Request");
  }

  return { body: { userID: parsedBody.userID, RoomID: parsedBody.RoomID } };
}
