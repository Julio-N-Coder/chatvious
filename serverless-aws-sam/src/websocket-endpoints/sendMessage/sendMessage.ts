import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { wsMessagesDBManager } from "../../models/web-socket-messages.js";
import { messagesManagerDB } from "../../models/messagesDB.js";

interface sendMessageBody {
  action: "sendmessage";
  message: string | undefined;
  RoomID: string | undefined;
}

export const handler = async (event: APIGatewayProxyWebsocketEventV2) => {
  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId;
  const callbackUrl = `https://${domain}/${stage}`;

  if (!event.body) {
    return {
      statusCode: 400,
      body: "Missing body",
    };
  }
  const body: sendMessageBody = JSON.parse(event.body);

  if (!body.message) {
    return { statusCode: 400, body: "Missing Message" };
  } else if (typeof body.message !== "string") {
    return { statusCode: 400, body: "Invalid Message" };
  } else if (!body.RoomID || typeof body.RoomID !== "string") {
    return { statusCode: 400, body: "Invalid RoomID" };
  } else if (body.RoomID.length < 20) {
    return { statusCode: 400, body: "Invalid RoomID" };
  } else if (body.RoomID.length > 50) {
    return { statusCode: 400, body: "Invalid RoomID" };
  } else if (body.message.length > 2000) {
    return { statusCode: 400, body: "Message too long" };
  }

  const RoomID = body.RoomID;
  const message = body.message;

  // check whether user is connected to the room
  const roomConnectionResponse = await wsMessagesDBManager.fetchRoomConnection(
    RoomID,
    connectionId
  );
  if ("error" in roomConnectionResponse) {
    if (roomConnectionResponse.error === "No data found") {
      return { statusCode: 400, body: "User not connected to the Chat room" };
    }
    return {
      statusCode: roomConnectionResponse.statusCode,
      body: roomConnectionResponse.error,
    };
  }

  const roomConnectionData = roomConnectionResponse.data;
  const userID = roomConnectionData.userID;
  const userName = roomConnectionData.userName;
  const profileColor = roomConnectionData.profileColor;
  const RoomUserStatus = roomConnectionData.RoomUserStatus;

  const client = new ApiGatewayManagementApiClient({ endpoint: callbackUrl });

  // fetch all connected clients in the room
  const allRoomConnectionsResponse =
    await wsMessagesDBManager.fetchAllRoomConnections(RoomID);
  if ("error" in allRoomConnectionsResponse) {
    return {
      statusCode: allRoomConnectionsResponse.statusCode,
      body: allRoomConnectionsResponse.error,
    };
  }

  const allRoomConnections = allRoomConnectionsResponse.data;
  const messageId = event.requestContext.messageId;
  const messageDate = new Date().toISOString();

  // loop through them to send messages to each of them. even the connected user
  const messageData = {
    // send userName and profileColor
    action: body.action,
    sender: {
      userName,
      RoomUserStatus,
      profileColor,
    },
    message,
    messageId,
    messageDate,
  };
  const messageDataString = JSON.stringify(messageData);

  allRoomConnections.forEach(async (connection) => {
    const requestParams = {
      ConnectionId: connection.connectionId,
      Data: messageDataString,
    };
    const command = new PostToConnectionCommand(requestParams);
    try {
      await client.send(command);
    } catch (error) {
      console.log("Error sending message");
      console.log(error);
    }
  });

  // store the message
  const messageResponse = await messagesManagerDB.storeMessage(
    userID,
    userName,
    RoomID,
    RoomUserStatus,
    profileColor,
    message,
    messageId,
    messageDate
  );
  if ("error" in messageResponse) {
    return {
      statusCode: messageResponse.statusCode,
      body: messageResponse.error,
    };
  }

  return {
    statusCode: 200,
    body: "Message sent successfully",
    messageId,
    messageDate,
  };
};
