import { handler } from "../disconnect.js";
import restAPIEventBase from "../../../../events/websocketApiDisconnectEvent.json";
import {
  initialConectDBWSManager,
  roomConnectionsWSManager,
} from "../../../models/web-socket-messages.js";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import {
  APIGatewayWebSocketDisconnectEvent,
  UserInfo,
  RoomInfoType,
} from "../../../types/types.js";
import { clearDynamoDB } from "../../../lib/libtest/handyTestUtils.js";

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
    await initialConectDBWSManager.storeInitialConnection(
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
    await roomConnectionsWSManager.storeRoomConnection(
      connectionId,
      userID,
      RoomID,
      userName,
      "OWNER",
      userInfo.profileColor
    );
  if ("error" in storeRoomConnectionResponse) {
    throw new Error(
      `Error while storing room connection. Error: ${storeRoomConnectionResponse.error}`
    );
  }

  restAPIEvent.requestContext.connectionId = connectionId;
});

afterAll(async () => {
  await clearDynamoDB();
});

describe("A test for the disconnect route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly remove connection information", async () => {
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);

    const initialConnectionCheck =
      await initialConectDBWSManager.fetchInitialConnection(connectionId);
    expect(initialConnectionCheck).toHaveProperty("error", "No data found");
    expect(initialConnectionCheck).toHaveProperty("statusCode", 404);

    const roomConnectionCheck =
      await roomConnectionsWSManager.fetchRoomConnection(RoomID, connectionId);
    expect(roomConnectionCheck).toHaveProperty("error", "No data found");
    expect(roomConnectionCheck).toHaveProperty("statusCode", 404);
  });
});
