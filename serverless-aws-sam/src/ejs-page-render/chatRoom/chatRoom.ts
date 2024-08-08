import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import fetchNavUserInfo from "../../lib/navUserInfo.js";
import { isProduction, addSetCookieHeaders } from "../../lib/handyUtils.js";
import { roomManager } from "../../models/rooms.js";

export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const userID = event.requestContext.authorizer?.claims.sub as string;
  const RoomID = event.pathParameters?.RoomID;
  if (RoomID == undefined) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({ error: "RoomID is required" }),
    };
  }

  // check whether user is a part of the room
  const roomMemberResponse = await roomManager.fetchRoomMember(RoomID, userID);
  if ("error" in roomMemberResponse) {
    if (roomMemberResponse.error === "Bad Request") {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMemberResponse.statusCode,
      body: JSON.stringify({ error: roomMemberResponse.error }),
    };
  }

  // fetch all chat room messages in reverse order to render them

  const navUserInfoResponse = await fetchNavUserInfo(userID);
  if ("error" in navUserInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: navUserInfoResponse.statusCode,
      body: JSON.stringify({ error: navUserInfoResponse.error }),
    };
  }

  const userInfo = navUserInfoResponse.data;
  const chatRoomHTML = await ejs.renderFile("../../views/chatRoom.ejs", {
    username: userInfo.userName,
    profileColor: userInfo.profileColor,
    navJoinRequest: userInfo.navJoinRequests,
    isProduction: isProduction(),
  });

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: chatRoomHTML,
  };

  return await addSetCookieHeaders(event, response);
}
