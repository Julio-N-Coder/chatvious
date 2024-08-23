import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManager } from "../../models/rooms.js";
import { userManager } from "../../models/users.js";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }

  const roomName = bodyValidation.body.roomName;
  const userID = event.requestContext.authorizer?.sub as string;
  const userName = event.requestContext.authorizer?.username as string;

  const userInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in userInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: userInfoResponse.statusCode,
      body: JSON.stringify({ error: userInfoResponse.error }),
    };
  }

  const userInfo = userInfoResponse.userInfo;
  const profileColor = userInfo.profileColor;

  if (userInfo.ownedRooms.length > 6) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({
        error: "You have reached the limit of rooms you can own. (6)",
      }),
    };
  }

  const makeRoomResponse = await roomManager.makeRoom(
    userID,
    userName,
    roomName,
    profileColor
  );
  if ("error" in makeRoomResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: makeRoomResponse.statusCode,
      body: JSON.stringify({ error: makeRoomResponse.error }),
    };
  }

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 201,
    body: JSON.stringify({
      message: makeRoomResponse.message,
      roomInfo: makeRoomResponse.roomInfo,
    }),
  };
}

function validateBody(
  event: APIGatewayProxyEvent
): APIGatewayProxyResult | { body: { roomName: string } } {
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
    return standardError("Room Name is required");
  }

  let parsedBody: { roomName?: string };
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    return standardError("Invalid JSON");
  }
  if (!parsedBody.roomName || typeof parsedBody.roomName !== "string") {
    return standardError("Room Name is required");
  }
  if (parsedBody.roomName.length < 3) {
    return standardError("Room Name must be at least 3 characters");
  }
  if (parsedBody.roomName.length > 20) {
    return standardError("Room Name must be less than 20 characters");
  }
  return { body: { roomName: parsedBody.roomName } };
}
