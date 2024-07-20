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

  const userID = event.requestContext.authorizer?.claims.sub as string;
  const userName = event.requestContext.authorizer?.claims.username as string;
  const RoomID = bodyValidation.body.RoomID;

  const fetchRoomResponse = await roomManger.fetchRoom(RoomID);
  if ("error" in fetchRoomResponse) {
    if (fetchRoomResponse.error === "Bad Request") {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: fetchRoomResponse.statusCode,
        body: JSON.stringify({ error: "Invalid RoomID" }),
      };
    }
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: fetchRoomResponse.statusCode,
      body: JSON.stringify({ error: fetchRoomResponse.error }),
    };
  }

  const roomMembersResponse = await roomManger.fetchRoomMembers(RoomID);
  if ("error" in roomMembersResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMembersResponse.statusCode,
      body: JSON.stringify({ error: roomMembersResponse.error }),
    };
  }

  const { roomName } = fetchRoomResponse.roomInfo;
  const { roomMembers } = roomMembersResponse;

  if (roomMembers.find((member) => member.userID === userID)) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({ error: "You are already a member of this room" }),
    };
  }

  const joinRequestResponse = await roomManger.fetchJoinRequest(RoomID, userID);
  if (
    "error" in joinRequestResponse &&
    joinRequestResponse.error !== "Bad Request"
  ) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: joinRequestResponse.statusCode,
      body: JSON.stringify({ error: joinRequestResponse.error }),
    };
  }
  if (joinRequestResponse.statusCode === 200) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "You have already sent a join Request" }),
    };
  }

  // fetch user info for profile colour
  const userInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: userInfoResponse.statusCode,
      body: JSON.stringify({ error: userInfoResponse.error }),
    };
  }
  const { profileColor } = userInfoResponse.userInfo;

  // send a join request to the room.
  const joinRequest = await roomManger.sendJoinRequest(
    userName,
    userID,
    roomName,
    RoomID,
    profileColor
  );
  if ("error" in joinRequest) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: joinRequest.statusCode,
      body: JSON.stringify({ error: joinRequest.error }),
    };
  }

  console.log("Sent Join Request");

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: joinRequest.statusCode,
    body: JSON.stringify({ message: joinRequest.message }),
  };
}

function validateBody(
  event: APIGatewayEvent
): APIGatewayProxyResult | { body: { RoomID: string } } {
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
    return standardError("Room ID is required");
  }

  let parsedBody: { RoomID?: string };
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    return standardError("Invalid JSON");
  }
  if (!parsedBody.RoomID || typeof parsedBody.RoomID !== "string") {
    return standardError("Room ID is required");
  }
  if (parsedBody.RoomID.length < 20) {
    return standardError("Room ID must be at least 20 characters");
  }
  if (parsedBody.RoomID.length > 50) {
    return standardError("Room ID must be less than 50 characters");
  }
  return { body: { RoomID: parsedBody.RoomID } };
}
