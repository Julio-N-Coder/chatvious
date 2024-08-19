import { handler } from "../sendMessage.js";
import restAPIEventBase from "../../../../events/websocketApiCustomEvent.json";
import { wsMessagesDBManager } from "../../../models/web-socket-messages.js";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { messagesManagerDB } from "../../../models/messagesDB.js";
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { UserInfo, RoomInfoType } from "../../../types/types.js";

let restAPIEvent = restAPIEventBase as APIGatewayProxyWebsocketEventV2;
let restAPIEventCopy: APIGatewayProxyWebsocketEventV2;
const connectionId = restAPIEvent.requestContext.connectionId;

let userInfo: UserInfo;
let userID: string;
let userName: string;

let roomInfo: RoomInfoType;
const roomName = "SendMessageTestRoom";
let RoomID: string;

let messageId: string;
let messageDate: string;
const message = "This is a test message";

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
    RoomID,
    userName,
    "OWNER",
    userInfo.profileColor
  );
  if ("error" in roomConnectionResponse) {
    throw new Error(
      `Error while storing room connection. Error: ${roomConnectionResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    action: "sendmessage",
    message,
    RoomID,
  });
  restAPIEvent.requestContext.connectionId = connectionId;
  restAPIEvent.requestContext.routeKey = "sendmessage";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterAll(async () => {
  // delete the message
  const deleteMessageResponse = await messagesManagerDB.deleteMessage(
    RoomID,
    messageDate,
    messageId
  );
  if (
    "error" in deleteMessageResponse &&
    deleteMessageResponse.error !== "No data found"
  ) {
    console.log("Error while deleting message");
    console.log(deleteMessageResponse.error);
  }

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

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("A test for the custom joinRoom route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store message information correclty", async () => {
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);
    expect(response).toHaveProperty("body", "Message sent successfully");

    if (!response.messageId && !response.messageDate) {
      throw new Error("No message id or date in response during test");
    }
    messageId = response.messageId;
    messageDate = response.messageDate;

    expect(response).toHaveProperty("messageId", messageId);
    expect(response).toHaveProperty("messageDate", messageDate);

    // check whether the message was correctly stored
    const getMessageResponse = await messagesManagerDB.fetchMessage(
      RoomID,
      messageDate,
      messageId
    );
    if ("error" in getMessageResponse) {
      throw new Error(
        `Error while fetching message in test. Error: ${getMessageResponse.error}`
      );
    }

    const messageData = getMessageResponse.data;
    expect(messageData).toHaveProperty("RoomID", RoomID);
    expect(messageData).toHaveProperty("message", message);
    expect(messageData).toHaveProperty("messageId", messageId);
    expect(messageData).toHaveProperty("sentAt", messageDate);
    expect(messageData).toHaveProperty("userID", userID);
  });

  test("Should return correct error when message is missing from body", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID,
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Missing Message");
  });

  test("Should return correct error when RoomID is missing from body", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      message,
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });

  test("Should return correct error when message is to long", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID,
      message:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".repeat(40) + "a", // 2001
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Message too long");
  });
});
