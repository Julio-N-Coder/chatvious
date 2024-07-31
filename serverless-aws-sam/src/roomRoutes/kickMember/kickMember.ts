import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManager } from "../../models/rooms.js";
import { userManager } from "../../models/users.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }

  const RoomID = bodyValidation.body.RoomID;
  const memberUserID = bodyValidation.body.userID;
  const userID = event.requestContext.authorizer?.claims.sub as string;

  const fetchRoomMemberResponse = await roomManager.fetchRoomMember(
    RoomID,
    userID
  );
  if ("error" in fetchRoomMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: fetchRoomMemberResponse.error }),
    };
  }

  const { RoomUserStatus } = fetchRoomMemberResponse.roomMember;
  if (!(RoomUserStatus === "OWNER") && !(RoomUserStatus === "ADMIN")) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  // check whether user is a lower status then kicker
  const memberUserInfo = await roomManager.fetchRoomMember(
    RoomID,
    memberUserID
  );
  if ("error" in memberUserInfo) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 404,
      body: JSON.stringify({ error: memberUserInfo.error }),
    };
  }

  const { RoomUserStatus: memberUserStatus } = memberUserInfo.roomMember;

  if (RoomUserStatus === "OWNER") {
    if (memberUserStatus === "OWNER") {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
  } else if (RoomUserStatus === "ADMIN") {
    if (memberUserStatus === "OWNER" || memberUserStatus === "ADMIN") {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
  }

  const removeRoomMemberResponse = roomManager.removeRoomMember(
    RoomID,
    memberUserID
  );
  if ("error" in removeRoomMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({ error: removeRoomMemberResponse.error }),
    };
  }

  // remove joinedRooms on kicked user.
  const removeJoinedRoomResponse = userManager.removeJoinedRoom(
    memberUserID,
    RoomID
  );
  if ("error" in removeJoinedRoomResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({ error: removeJoinedRoomResponse.error }),
    };
  }

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({ message: "User Successfully Kicked" }),
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
