import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import { roomManger } from "../../models/rooms.js";
import fetchNavUserInfo from "../../lib/navUserInfo.js";

export async function roomInfo(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const RoomID = event.pathParameters?.RoomID;
  if (RoomID == undefined) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
      body: JSON.stringify({ error: "RoomID is required" }),
    };
  }

  const userID = event.requestContext.authorizer?.claims.sub as string;

  const roomInfoResponse = await roomManger.fetchRoom(RoomID);
  if ("error" in roomInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomInfoResponse.statusCode,
      body: JSON.stringify({ error: roomInfoResponse.error }),
    };
  }

  // fetch RoomMembers to display
  const roomMembersResponse = await roomManger.fetchRoomMembers(RoomID);
  if ("error" in roomMembersResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMembersResponse.statusCode,
      body: JSON.stringify({
        error: "Failed to Render Page. I am sorry for the inconvenience.",
      }),
    };
  }

  const { roomMembers } = roomMembersResponse;
  let isAdmin = false;
  let isOwner = false;
  let isMember = false;
  // can instead check by ownedRooms, joinedRooms on the user on req.user.
  roomMembers.find((member) => {
    if (member.userID === userID) {
      if (member.RoomUserStatus === "OWNER") {
        isOwner = true;
      } else if (member.RoomUserStatus === "ADMIN") {
        isAdmin = true;
      } else {
        isMember = true;
      }
    }
  });

  const roomOwner = roomMembers.find(
    (member) => member.RoomUserStatus === "OWNER"
  );
  if (roomOwner == undefined) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 500,
      body: JSON.stringify({ error: "Room Owner not found" }),
    };
  }

  const { roomInfo } = roomInfoResponse;
  // fetch nav user info
  const fetchNavUserInfoResponse = await fetchNavUserInfo(userID);
  if ("error" in fetchNavUserInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: fetchNavUserInfoResponse.statusCode,
      body: JSON.stringify({ error: fetchNavUserInfoResponse.error }),
    };
  }
  const navUserInfo = fetchNavUserInfoResponse.data;
  const { profileColor, userName } = navUserInfo;
  const navJoinRequest = navUserInfo.navJoinRequests;

  if (isOwner || isAdmin) {
    const joinRequestResponse = await roomManger.fetchJoinRequests(RoomID);
    if ("error" in joinRequestResponse) {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: joinRequestResponse.statusCode,
        body: JSON.stringify({ error: joinRequestResponse.error }),
      };
    }
    const { joinRequests } = joinRequestResponse;

    console.log("rendering roomInfo page", "Owner");
    const roomInfoHTML = await ejs.renderFile("../../views/roomInfo.ejs", {
      roomInfo,
      roomOwner,
      roomMembers,
      isOwnerOrAdmin: true,
      isOwner,
      joinRequests,
      navJoinRequest,
      profileColor,
      username: userName,
    });
    return {
      headers: { "Content-Type": "text/html" },
      statusCode: 200,
      body: roomInfoHTML,
    };
  }

  console.log("rendering roomInfo page");
  const roomInfoHTML = await ejs.renderFile("../../views/roomInfo.ejs", {
    roomInfo,
    roomOwner,
    roomMembers,
    isMember,
    isOwnerOrAdmin: false,
    isOwner,
    navJoinRequest,
    profileColor,
    username: userName,
  });

  return {
    headers: { "Content-Type": "text/html" },
    statusCode: 200,
    body: roomInfoHTML,
  };
}
