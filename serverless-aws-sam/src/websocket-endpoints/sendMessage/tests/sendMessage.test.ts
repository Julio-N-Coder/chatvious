import { handler } from "../sendMessage.js";
import restAPIEventBase from "../../../../events/websocketApiCustomEvent.json";
import { wsMessagesDBManager } from "../../../models/web-socket-messages.js";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { messagesManagerDB } from "../../../models/messagesDB.js";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { UserInfo, RoomInfoType } from "../../../types/types.js";

const restAPIEvent = restAPIEventBase as APIGatewayProxyWebsocketEventV2;
const connectionId = restAPIEvent.requestContext.connectionId;

let userInfo: UserInfo;
let userID: string;
let userName: string;

let roomInfo: RoomInfoType;
const roomName = "SendMessageTestRoom";
let RoomID: string;

beforeAll(async () => {
  // make a test user
  const makeUserResponse = await userManager.createUser();
  if ("error" in makeUserResponse) {
    throw new Error(
      `Error while making a user. Error: ${makeUserResponse.error}`
    );
  }
  userInfo = makeUserResponse.newUser;
  userID = userInfo.userID;
  userName = userInfo.userName;

  // make a room to check whether user is part of room
  const makeRoomResponse = await roomManager.makeRoom(
    userID,
    userName,
    roomName,
    userInfo.profileColor
  );
  if ("error" in makeRoomResponse) {
    throw new Error(
      `Error while making a room. Error: ${makeRoomResponse.error}`
    );
  }
  roomInfo = makeRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  // store join room Connection Information
  const roomConnectionResponse = await wsMessagesDBManager.storeRoomConnection(
    connectionId,
    userID,
    RoomID
  );
  if ("error" in roomConnectionResponse) {
    throw new Error(
      `Error while storing room connection. Error: ${roomConnectionResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    action: "sendmessage",
    RoomID,
  });
  restAPIEvent.requestContext.connectionId = connectionId;
  restAPIEvent.requestContext.routeKey = "sendmessage";
});

afterAll(async () => {
  // delete the message
  const deleteMessageResponse = await messagesManagerDB.deleteMessage;

  // delete the room connection
  const deleteRoomConnectionResponse =
    await wsMessagesDBManager.deleteRoomConnection(RoomID, connectionId);
  if (
    "error" in deleteRoomConnectionResponse &&
    deleteRoomConnectionResponse.error !== "No data found"
  ) {
    console.log("Error while deleting room connection");
    console.log(deleteRoomConnectionResponse.error);
  }

  // delete the room member entry for the test user
  const deleteRoomMemberResponse = await roomManager.removeRoomMember(
    RoomID,
    userID
  );
  if (
    "error" in deleteRoomMemberResponse &&
    deleteRoomMemberResponse.error !== "Bad Request"
  ) {
    console.log("Error while deleting room member");
    console.log(deleteRoomMemberResponse.error);
  }

  // delete the test user
  const deleteUserResponse = await userManager.deleteUser(userID);
  if (
    "error" in deleteUserResponse &&
    deleteUserResponse.error !== "User not found"
  ) {
    console.log("Error while deleting user");
    console.log(deleteUserResponse.error);
  }

  // delete the room
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if (
    "error" in deleteRoomResponse &&
    deleteRoomResponse.error !== "Bad Request"
  ) {
    console.log("Error while deleting room");
    console.log(deleteRoomResponse.error);
  }
});
describe("A test for the custom joinRoom route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store message information correclty", async () => {
    const response = await handler(restAPIEvent);
  });
});
