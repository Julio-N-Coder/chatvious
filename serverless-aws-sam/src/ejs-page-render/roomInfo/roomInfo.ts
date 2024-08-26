import { APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import ejs from "ejs";
import {
  roomManager,
  roomUsersManager,
  joinRequestManager,
} from "../../models/rooms.js";
import fetchNavUserInfo from "../../lib/navUserInfo.js";
import { isProduction, addSetCookieHeaders } from "../../lib/handyUtils.js";

export async function handler(
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

  const userID = event.requestContext.authorizer?.sub as string;

  const roomInfoResponse = await roomManager.fetchRoom(RoomID);
  if ("error" in roomInfoResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomInfoResponse.statusCode,
      body: JSON.stringify({ error: roomInfoResponse.error }),
    };
  }

  // fetch RoomMembers to display
  const roomMembersResponse = await roomUsersManager.fetchRoomMembers(RoomID);
  if (
    "error" in roomMembersResponse ||
    "roomMembersKeys" in roomMembersResponse
  ) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode:
        "error" in roomMembersResponse ? roomMembersResponse.statusCode : 500,
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
  const staticContentUrl =
    process.env.SUB_DOMAIN_URL || "https://main.chatvious.coding-wielder.com";
  const domainUrl =
    process.env.DOMAIN_URL || "https://chatvious.coding-wielder.com";

  if (isOwner || isAdmin) {
    const joinRequestResponse = await joinRequestManager.fetchJoinRequests(
      RoomID
    );
    if (
      "error" in joinRequestResponse ||
      "joinRequestsKeys" in joinRequestResponse
    ) {
      if ("error" in joinRequestResponse) {
        return {
          headers: { "Content-Type": "application/json" },
          statusCode: joinRequestResponse.statusCode,
          body: JSON.stringify({ error: joinRequestResponse.error }),
        };
      }
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: 500,
        body: JSON.stringify({
          error:
            "Fetched Wrong Join Request type. Were sorry for the inconvenience",
        }),
      };
    }
    const { joinRequests } = joinRequestResponse;

    const roomInfoHTML = await ejs.renderFile("./views/roomInfo.ejs", {
      roomInfo,
      roomOwner,
      roomMembers,
      isMember,
      isAdmin,
      isOwner,
      joinRequests,
      navJoinRequest,
      profileColor,
      username: userName,
      isProduction: isProduction(),
      staticContentUrl,
      domainUrl,
    });

    const ownerAdminSucess = {
      headers: { "Content-Type": "text/html" },
      statusCode: 200,
      body: roomInfoHTML,
    };

    return await addSetCookieHeaders(event, ownerAdminSucess);
  }

  // check whether they have sent a join request
  let hasSentJoinRequest = false;
  if (!isMember) {
    const fetchJoinRequestResponse = await joinRequestManager.fetchJoinRequest(
      RoomID,
      userID
    );
    if (
      "error" in fetchJoinRequestResponse &&
      fetchJoinRequestResponse.error !== "Bad Request"
    ) {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: fetchJoinRequestResponse.statusCode,
        body: JSON.stringify({ error: fetchJoinRequestResponse.error }),
      };
    }
    if ("joinRequest" in fetchJoinRequestResponse) {
      hasSentJoinRequest = true;
    }
  }

  const roomInfoHTML = await ejs.renderFile("./views/roomInfo.ejs", {
    roomInfo,
    roomOwner,
    roomMembers,
    isMember,
    isAdmin,
    isOwner,
    hasSentJoinRequest,
    navJoinRequest,
    profileColor,
    username: userName,
    isProduction: isProduction(),
    staticContentUrl,
    domainUrl,
  });

  const memberVisitorSuccess = {
    headers: { "Content-Type": "text/html" },
    statusCode: 200,
    body: roomInfoHTML,
  };

  return await addSetCookieHeaders(event, memberVisitorSuccess);
}
