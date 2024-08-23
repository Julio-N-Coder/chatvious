import { handler } from "../joinRoom.js";
import restAPIEventBase from "../../../../events/websocketApiCustomEvent.json";
import { wsMessagesDBManager } from "../../../models/web-socket-messages.js";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { RoomInfoType } from "../../../types/types.js";
import { clearDynamoDB } from "../../../lib/libtest/handyTestUtils.js";

const restAPIEvent = restAPIEventBase as APIGatewayProxyWebsocketEventV2;
const connectionId = restAPIEvent.requestContext.connectionId;

const userInfo = {
  userID: "e192c74f-cc2e-49c7-a0b8-f70df7218845",
  userName: "WebSocket-joinRoomUser",
  email: "WebSocket-joinRoomUser@test.com",
  profileColor: "green",
};
const userID = userInfo.userID;
const userName = userInfo.userName;

let roomInfo: RoomInfoType;
const roomName = "WSjoinRoomTestRoom";
let RoomID: string;

beforeAll(async () => {
  // make a test user
  const makeUserResponse = await userManager.createUser(
    userID,
    userName,
    userInfo.email,
    userInfo.profileColor
  );
  if ("error" in makeUserResponse) {
    throw new Error(
      `Error while making a user. Error: ${makeUserResponse.error}`
    );
  }

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

  // store initial Connection Information
  const storeInitialConnectionResponse =
    await wsMessagesDBManager.storeInitialConnection(connectionId, userID);
  if ("error" in storeInitialConnectionResponse) {
    throw new Error(
      `Error while storing initial connection. Error: ${storeInitialConnectionResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    action: "joinroom",
    RoomID,
  });
  restAPIEvent.requestContext.connectionId = connectionId;
  restAPIEvent.requestContext.routeKey = "joinroom";
});

afterAll(async () => {
  await clearDynamoDB();
});

describe("A test for the custom joinRoom route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store connection information correclty", async () => {
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);
    if (!response.body) {
      throw new Error("No body in response");
    }

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Joined Room Successfully");

    // check if the connection information is stored correctly
    const fetchRoomConnectionResponse =
      await wsMessagesDBManager.fetchRoomConnection(RoomID, connectionId);
    if ("error" in fetchRoomConnectionResponse) {
      throw new Error(
        `Error while fetching room connection in test. Error: ${fetchRoomConnectionResponse.error}`
      );
    }

    const roomConnectionData = fetchRoomConnectionResponse.data;
    expect(roomConnectionData).toHaveProperty("RoomID", RoomID);
    expect(roomConnectionData).toHaveProperty("connectionId", connectionId);
    expect(roomConnectionData).toHaveProperty("userID", userID);

    // check whether initial Connection info was updated with RoomID
    const fetchInitialConnectionResponse =
      await wsMessagesDBManager.fetchInitialConnection(connectionId);
    if ("error" in fetchInitialConnectionResponse) {
      throw new Error(
        `Error while fetching initial connection in test. Error: ${fetchInitialConnectionResponse.error}`
      );
    }

    const initialConnectionData = fetchInitialConnectionResponse.data;
    expect(initialConnectionData).toHaveProperty("RoomID", RoomID);
    expect(initialConnectionData).toHaveProperty("userID", userID);
    expect(initialConnectionData).toHaveProperty("connectionId", connectionId);
  });

  test("Should return correct error when RoomID is missing from body", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Missing RoomID");
  });

  test("Should return correct error when RoomID is not a string", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID: true,
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });

  test("Should return correct error when RoomID is less than 20 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID: "RoomIDLessThan20",
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });

  test("Should return correct error when RoomID is greater than 50 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID: "AVeryVeryVeryLongRoomIDThatIsGreaterThan50Characters",
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });
});
