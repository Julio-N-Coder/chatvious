import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManager } from "../../models/rooms.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }
  const RoomID = bodyValidation.body.RoomID;
  const userID = event.requestContext.authorizer?.sub as string;

  // check if they are owner
  const roomMemberResponse = await roomManager.fetchRoomMember(RoomID, userID);
  if ("error" in roomMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMemberResponse.statusCode,
      body: JSON.stringify({
        error: roomMemberResponse.error,
      }),
    };
  }

  const roomMemberStatus = roomMemberResponse.roomMember.RoomUserStatus;
  if (roomMemberStatus !== "OWNER") {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({
        error: "You are not the owner of this room",
      }),
    };
  }

  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if ("error" in deleteRoomResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: deleteRoomResponse.statusCode,
      body: JSON.stringify({
        error: deleteRoomResponse.error,
      }),
    };
  }

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({
      message: "Room Deleted successfully",
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

  if (event.headers["Content-Type"] !== "application/json") {
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
