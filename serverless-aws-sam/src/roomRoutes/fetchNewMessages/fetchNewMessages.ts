import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { roomManager } from "../../models/rooms.js";
import { messagesManagerDB } from "../../models/messagesDB.js";
import { MessageKeys } from "../../types/types.js";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const bodyValidation = validateBody(event);
  if ("statusCode" in bodyValidation) {
    return bodyValidation;
  }

  const userID = event.requestContext.authorizer?.claims.sub;
  const RoomID = bodyValidation.body.RoomID;
  const LastEvaluatedKey = bodyValidation.body.LastEvaluatedKey;

  // check if user is in the room
  const roomMemberResponse = await roomManager.fetchRoomMember(RoomID, userID);
  if ("error" in roomMemberResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: roomMemberResponse.statusCode,
      body: JSON.stringify({ error: roomMemberResponse.error }),
    };
  }

  const twentyMessagesResponse =
    await messagesManagerDB.roomMessagesPaginateBy20(RoomID, LastEvaluatedKey);
  if ("error" in twentyMessagesResponse) {
    return {
      headers: { "Content-Type": "application/json" },
      statusCode: twentyMessagesResponse.statusCode,
      body: JSON.stringify({ error: twentyMessagesResponse.error }),
    };
  }

  const twentyMessages = twentyMessagesResponse.data;

  return {
    headers: { "Content-Type": "application/json" },
    statusCode: 200,
    body: JSON.stringify({
      message: twentyMessagesResponse.message,
      data: twentyMessages,
      LastEvaluatedKey: twentyMessagesResponse.LastEvaluatedKey || false,
    }),
  };
};

function validateBody(
  event: APIGatewayProxyEvent
):
  | APIGatewayProxyResult
  | { body: { RoomID: string; LastEvaluatedKey: MessageKeys | false } } {
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
    RoomID?: string;
    LastEvaluatedKey?: MessageKeys | false;
  };
  try {
    parsedBody = JSON.parse(event.body);
  } catch (error) {
    return standardError("Invalid JSON");
  }
  if (!parsedBody.RoomID || "LastEvaluatedKey" in parsedBody) {
    return standardError("Bad Request");
  }

  if (typeof parsedBody.RoomID !== "string") {
    return standardError("Bad Request");
  }

  return {
    body: {
      RoomID: parsedBody.RoomID,
      LastEvaluatedKey: parsedBody.LastEvaluatedKey || false,
    },
  };
}
