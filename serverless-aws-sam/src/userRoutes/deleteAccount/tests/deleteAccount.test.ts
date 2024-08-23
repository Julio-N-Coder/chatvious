import { handler } from "../deleteAccount.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { APIGatewayProxyEvent } from "aws-lambda";
import { UserInfo, RoomInfoType } from "../../../types/types.js";
import {
  newTestUser,
  clearDynamoDB,
} from "../../../lib/libtest/handyTestUtils.js";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

let restAPIEvent: APIGatewayProxyEvent = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: APIGatewayProxyEvent;
const homePage =
  process.env.SUB_DOMAIN_URL || "https://main.chatvious.coding-wielder.com";

const userID = restAPIEvent.requestContext.authorizer?.sub as string;
const userName = restAPIEvent.requestContext.authorizer?.username as string;

let userInfo: UserInfo;

const roomName = "deleteAcountOwnedRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let joinRoomOwnerUser: UserInfo;
let joinRoomOwnerID: string;
let joinRoomOwnerName: string;

const joinRoomName = "deleteAcountJoinedRoom";
let joinRoomInfo: RoomInfoType;
let joinRoomID: string;

beforeAll(async () => {
  userInfo = await newTestUser(userID, userName);

  // make my own room
  const createRoomResponse = await roomManager.makeRoom(
    userID,
    userName,
    roomName,
    userInfo.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  // make a user for the person owned the joined room
  const createJoinRoomUserResponse = await userManager.createUser();
  if ("error" in createJoinRoomUserResponse) {
    throw new Error(
      `Failed to create Joined Room owner user. Error: ${createJoinRoomUserResponse.error}`
    );
  }
  joinRoomOwnerUser = createJoinRoomUserResponse.newUser;
  joinRoomOwnerID = joinRoomOwnerUser.userID;
  joinRoomOwnerName = joinRoomOwnerUser.userName;

  // make a room for the user to join
  const createJoinedRoomResponse = await roomManager.makeRoom(
    joinRoomOwnerID,
    joinRoomOwnerName,
    joinRoomName,
    joinRoomOwnerUser.profileColor
  );
  if ("error" in createJoinedRoomResponse) {
    throw new Error(
      `Failed to create Joined Room. Error: ${createJoinedRoomResponse.error}`
    );
  }
  joinRoomInfo = createJoinedRoomResponse.roomInfo;
  joinRoomID = joinRoomInfo.RoomID;

  // enter user into joined room
  const joinRoomResponse = await roomManager.addRoomMember(
    joinRoomID,
    userID,
    userName,
    userInfo.profileColor
  );
  if ("error" in joinRoomResponse) {
    throw new Error(`Failed to join room. Error: ${joinRoomResponse.error}`);
  }

  // udpate users joined rooms on the user
  const updateUserJoinedRoomsResponse = await userManager.updateJoinedRooms(
    userID,
    { RoomID: joinRoomID, isAdmin: false, roomName: joinRoomName }
  );

  restAPIEvent.body = JSON.stringify({});
  restAPIEvent.path = "/deleteAccount";
  restAPIEvent.resource = "/deleteAccount";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  jest.clearAllMocks();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

afterAll(async () => {
  await clearDynamoDB();
});

describe("Tests for the deleteAccount route", () => {
  test("should Delete the users account with associated resouces", async () => {
    // @ts-ignore
    CognitoIdentityProviderClient.prototype.send = jest.fn().mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });

    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);
    expect(response).toHaveProperty("multiValueHeaders");
    expect(response.multiValueHeaders).toHaveProperty("Set-Cookie");

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "successfully Deleted Account");
    expect(CognitoIdentityProviderClient.prototype.send).toHaveBeenCalledTimes(
      1
    );
  });
});
