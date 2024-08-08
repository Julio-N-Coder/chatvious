import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { wsMessagesDBManager } from "../../models/web-socket-messages.js";
import { roomManager } from "../../models/rooms.js";

interface joinRoomBody {
  action: "joinroom";
  RoomID?: string;
}

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const connectionId = event.requestContext.connectionId;

  if (!event.body) {
    return { statusCode: 400, body: "Missing Body" };
  }

  let body: joinRoomBody;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: "Invalid Body" };
  }

  if (!body.RoomID) {
    return { statusCode: 400, body: "Missing RoomID" };
  } else if (typeof body.RoomID !== "string") {
    return { statusCode: 400, body: "Invalid RoomID" };
  } else if (body.RoomID.length < 20) {
    return { statusCode: 400, body: "Invalid RoomID" };
  } else if (body.RoomID.length > 50) {
    return { statusCode: 400, body: "Invalid RoomID" };
  }

  const RoomID = body.RoomID;

  const initialConnectionResponse =
    await wsMessagesDBManager.fetchInitialConnection(connectionId);
  if ("error" in initialConnectionResponse) {
    return {
      statusCode: initialConnectionResponse.statusCode,
      body: initialConnectionResponse.error,
    };
  }

  const { userID } = initialConnectionResponse.data;
  // check whether they are part of the room
  const roomMemberResponse = await roomManager.fetchRoomMember(RoomID, userID);
  if ("error" in roomMemberResponse) {
    return {
      statusCode: roomMemberResponse.statusCode,
      body: roomMemberResponse.error,
    };
  }
  const userName = roomMemberResponse.roomMember.userName;
  const RoomUserStatus = roomMemberResponse.roomMember.RoomUserStatus;
  const profileColor = roomMemberResponse.roomMember.profileColor;

  // update initial connection to include RoomID
  const deleteInitialConnectionResponse =
    await wsMessagesDBManager.updateInitialConnectionWithRoomID(
      connectionId,
      RoomID
    );
  if ("error" in deleteInitialConnectionResponse) {
    return {
      statusCode: deleteInitialConnectionResponse.statusCode,
      body: deleteInitialConnectionResponse.error,
    };
  }

  // save them to the websocket chat room in database
  const storeRoomMemberResponse = await wsMessagesDBManager.storeRoomConnection(
    connectionId,
    userID,
    RoomID,
    userName,
    RoomUserStatus,
    profileColor
  );
  if ("error" in storeRoomMemberResponse) {
    return {
      statusCode: storeRoomMemberResponse.statusCode,
      body: storeRoomMemberResponse.error,
    };
  }

  // notify the user about sucessfull join (do both of these in one loop)
  // notify other users of joined a new joined user to be able to show them on a sidebar

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Joined Room Successfully" }),
  };
};
