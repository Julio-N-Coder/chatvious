import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomUsersManager } from "../../models/rooms.js";
import { roomsOnUserManager } from "../../models/users.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }
  const RoomID = bodyValidation.body.RoomID;
  const userID = event.requestContext.authorizer?.sub as string;

  const roomMemberResponse = await roomUsersManager.fetchRoomMember(
    RoomID,
    userID
  );
  if ("error" in roomMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMemberResponse.statusCode,
      body: JSON.stringify({ error: roomMemberResponse.error }),
    };
  }
  const roomMember = roomMemberResponse.roomMember;
  if (roomMember.RoomUserStatus === "OWNER") {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({
        error:
          "Cannot leave room as owner. If you wish to leave, appoint someone else as owner or delete the room",
      }),
    };
  } else if (roomMember.userID !== userID) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({
        error: "Forbiden",
      }),
    };
  }

  const leaveRoomResponse = await roomUsersManager.removeRoomMember(
    RoomID,
    userID
  );
  if ("error" in leaveRoomResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: leaveRoomResponse.statusCode,
      body: JSON.stringify({
        error: "Sorry, there seems to be a problem with our servers",
      }),
    };
  }

  const removeRoomOnUserResponse = await roomsOnUserManager.removeRoomOnUser(
    userID,
    RoomID
  );
  if ("error" in removeRoomOnUserResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: removeRoomOnUserResponse.statusCode,
      body: JSON.stringify({
        error: "Sorry, there seems to be a problem with our servers",
      }),
    };
  }

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({
      message: "Successfully Left the room",
    }),
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

  const contentType =
    event.headers["content-type"] || event.headers["Content-Type"];
  if (contentType !== "application/json") {
    return standardError("Invalid Content Type");
  }
  if (!event.body) {
    return standardError("Bad Request");
  }

  let parsedBody: { RoomID?: string };
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    return standardError("Invalid JSON");
  }
  if (!parsedBody.RoomID) {
    return standardError("Bad Request");
  }

  return { body: { RoomID: parsedBody.RoomID } };
}
