import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManger } from "../../models/rooms.js";

export default async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const userID = event.requestContext.authorizer?.claims.sub as string;
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }

  const RoomID = bodyValidation.body.RoomID;
  const requestUserID = bodyValidation.body.userID;

  // need to add a check to see whether requestUser is already kicked (not part of room)

  const roomMemberResponse = await roomManger.fetchRoomMember(RoomID, userID);
  if ("error" in roomMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMemberResponse.statusCode,
      // this might be the wrong message to return. check this. I think it should return Forbidden
      body: JSON.stringify({ error: "Member Already Kicked" }),
    };
  }

  const { RoomUserStatus } = roomMemberResponse.roomMember;

  if (RoomUserStatus !== "OWNER" && RoomUserStatus !== "ADMIN") {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

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

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({ message: "Join request rejected successfully" }),
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
