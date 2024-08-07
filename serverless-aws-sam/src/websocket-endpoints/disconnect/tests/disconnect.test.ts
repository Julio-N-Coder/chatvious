import { handler } from "../disconnect.js";
import restAPIEventBase from "../../../../events/websocketApiDisconnectEvent.json";
import { wsMessagesDBManager } from "../../../models/web-socket-messages.js";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import {
  APIGatewayWebSocketDisconnectEvent,
  UserInfo,
  RoomInfoType,
} from "../../../types/types.js";

const restAPIEvent = restAPIEventBase as APIGatewayWebSocketDisconnectEvent;
const connectionId = restAPIEvent.requestContext.connectionId;

let userInfo: UserInfo;
let userID: string;
let userName: string;

let roomInfo: RoomInfoType;
const roomName = "disconnectTestRoom";
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

  // make a room for the user to be a part of
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

  // store initial Connection Information
  const storeInitialConnectionResponse =
    await wsMessagesDBManager.storeInitialConnection(
      connectionId,
      userID,
      RoomID
    );
  if ("error" in storeInitialConnectionResponse) {
    throw new Error(
      `Error while storing initial connection. Error: ${storeInitialConnectionResponse.error}`
    );
  }

  // store room connection information
  const storeRoomConnectionResponse =
    await wsMessagesDBManager.storeRoomConnection(connectionId, userID, RoomID);
  if ("error" in storeRoomConnectionResponse) {
    throw new Error(
      `Error while storing room connection. Error: ${storeRoomConnectionResponse.error}`
    );
  }

  restAPIEvent.requestContext.connectionId = connectionId;
});

afterAll(async () => {
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

  // delete the initial connection
  const deleteInitialConnectionResponse =
    await wsMessagesDBManager.deleteInitialConnection(connectionId);
  if (
    "error" in deleteInitialConnectionResponse &&
    deleteInitialConnectionResponse.error !== "No data found"
  ) {
    console.log("Error while deleting initial connection");
    console.log(deleteInitialConnectionResponse.error);
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

describe("A test for the disconnect route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly remove connection information", async () => {
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);

    const initialConnectionCheck =
      await wsMessagesDBManager.fetchInitialConnection(connectionId);
    expect(initialConnectionCheck).toHaveProperty("error", "No data found");
    expect(initialConnectionCheck).toHaveProperty("statusCode", 404);

    const roomConnectionCheck = await wsMessagesDBManager.fetchRoomConnection(
      RoomID,
      connectionId
    );
    expect(roomConnectionCheck).toHaveProperty("error", "No data found");
    expect(roomConnectionCheck).toHaveProperty("statusCode", 404);
  });
});
