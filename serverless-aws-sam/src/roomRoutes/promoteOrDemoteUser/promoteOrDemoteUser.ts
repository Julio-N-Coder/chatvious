import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManager } from "../../models/rooms.js";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }

  const userID = event.requestContext.authorizer?.claims.sub as string;
  const RoomID = bodyValidation.body.RoomID;
  const memberUserID = bodyValidation.body.userID;
  const action = bodyValidation.body.action;

  const fetchRoomMemberResponse = await roomManager.fetchRoomMember(
    RoomID,
    userID
  );
  if ("error" in fetchRoomMemberResponse) {
    if (fetchRoomMemberResponse.statusCode === 500) {
      return {
        headers: { "Content-Type": "application/json" },
        statusCode: 500,
        body: JSON.stringify({
          error:
            "Failed to get your user Info. Were sorry for the inconvenience",
        }),
      };
    }

    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: fetchRoomMemberResponse.error }),
    };
  }

  const userData = fetchRoomMemberResponse.roomMember;
  if (!(userData.RoomUserStatus === "OWNER")) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  const fetchRoomMemberResponse2 = await roomManager.fetchRoomMember(
    RoomID,
    memberUserID
  );
  if ("error" in fetchRoomMemberResponse2) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: fetchRoomMemberResponse2.statusCode,
      body: JSON.stringify({ error: fetchRoomMemberResponse2.error }),
    };
  }

  const memberUserData = fetchRoomMemberResponse2.roomMember;
  const checkMemberStatus = action === "PROMOTE" ? "MEMBER" : "ADMIN";

  if (!(memberUserData.RoomUserStatus === checkMemberStatus)) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  const updateRoomUserStatusResponse = await roomManager.updateRoomUserStatus(
    RoomID,
    memberUserID,
    action === "PROMOTE" ? "ADMIN" : "MEMBER"
  );
  if ("error" in updateRoomUserStatusResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: updateRoomUserStatusResponse.statusCode,
      body: JSON.stringify({ error: updateRoomUserStatusResponse.error }),
    };
  }

  const requestAction = action === "PROMOTE" ? "Promoted" : "Demoted";
  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({ message: `Successfully ${requestAction} User` }),
  };
};

function validateBody(
  event: APIGatewayProxyEvent
):
  | APIGatewayProxyResult
  | { body: { userID: string; RoomID: string; action: "PROMOTE" | "DEMOTE" } } {
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

  let parsedBody: {
    userID?: string;
    RoomID?: string;
    action?: "PROMOTE" | "DEMOTE";
  };
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    return standardError("Invalid JSON");
  }
  if (!parsedBody.RoomID || !parsedBody.userID || !parsedBody.action) {
    return standardError("Bad Request");
  }

  if (
    typeof parsedBody.RoomID !== "string" &&
    typeof parsedBody.userID !== "string"
  ) {
    return standardError("Bad Request");
  }

  const validActions = ["PROMOTE", "DEMOTE"];
  if (!validActions.includes(parsedBody.action)) {
    return standardError("Bad Request");
  }

  return {
    body: {
      userID: parsedBody.userID,
      RoomID: parsedBody.RoomID,
      action: parsedBody.action,
    },
  };
}
