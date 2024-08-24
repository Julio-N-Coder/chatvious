import { handler } from "../deleteRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import {
  roomManager,
  roomUsersManager,
  joinRequestManager,
} from "../../../models/rooms.js";
import { userManager } from "../../../models/users.js";
import { messagesManagerDB } from "../../../models/messagesDB.js";
import { UserInfo, RoomInfoType } from "../../../types/types.js";
import {
  newTestUser,
  clearDynamoDB,
  checkRoomsOnUser,
} from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;
let newUser: UserInfo;

const roomName = "deleteRoomTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  // make a room for the user to delete
  const createRoomResponse = await roomManager.makeRoom(
    userID,
    userName,
    roomName,
    newUser.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
  restAPIEvent.path = "/rooms/deleteRoom";
  restAPIEvent.resource = "/rooms/deleteRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

let remakeRoom = false;

afterEach(async () => {
  if (remakeRoom) {
    const createRoomResponse = await roomManager.makeRoom(
      userID,
      userName,
      roomName,
      newUser.profileColor
    );
    if ("error" in createRoomResponse) {
      throw new Error(
        `Failed to create room. Error: ${createRoomResponse.error}`
      );
    }
    roomInfo = createRoomResponse.roomInfo;
    RoomID = roomInfo.RoomID;
  }
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
});

afterAll(async () => {
  await clearDynamoDB();
});

describe("A Test for The deleteRoom Route", () => {
  test("Should return a successfull response and deletes the room", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe("Room Deleted successfully");

    // check if room was deleted
    const fetchRoomResponse = await roomManager.fetchRoom(RoomID);
    if (
      "error" in fetchRoomResponse &&
      fetchRoomResponse.error !== "Bad Request"
    ) {
      throw new Error(
        `Failed to fetch room in test. Error: ${fetchRoomResponse.error}`
      );
    }

    expect(fetchRoomResponse).toHaveProperty("statusCode", 400);
    expect(fetchRoomResponse).toHaveProperty("error", "Bad Request");
    await checkRoomsOnUser(userID, RoomID, roomName, "Removed");
    remakeRoom = true;
  });

  test("Should correctly delete room with multiple resouces", async () => {
    const fakeUserData = {
      userName: "FakeTestName",
      userID: "fakeUserID",
      email: "fakeTestEmail@test.com",
      profileColor: "green",
      fakeStatus: "MEMBER",
      fakeMadeDate: "fakeMadeDate",
    };

    const fakeMessageData = {
      message: "fake message",
      messageId: "fakeMessageID",
      messageDate: "fakeTimestamp",
    };

    // make a user to use
    const addUserResponse = await userManager.createUser(
      fakeUserData.userID,
      fakeUserData.userName,
      fakeUserData.email,
      fakeUserData.profileColor
    );
    if ("error" in addUserResponse) {
      throw new Error(
        `Failed to add user testing data. Error: ${addUserResponse.error}`
      );
    }

    // add join request
    const joinRequestResponse = await joinRequestManager.sendJoinRequest(
      fakeUserData.userName,
      fakeUserData.userID,
      roomName,
      RoomID,
      fakeUserData.profileColor
    );
    if ("error" in joinRequestResponse) {
      throw new Error(
        `Failed to add join request testing data. Error: ${joinRequestResponse.error}`
      );
    }

    // add roomMembers
    const addRoomMemberResponse = await roomUsersManager.addRoomMember(
      RoomID,
      fakeUserData.userID,
      roomName,
      fakeUserData.userName,
      fakeUserData.profileColor,
      fakeUserData.fakeMadeDate
    );
    if ("error" in addRoomMemberResponse) {
      throw new Error(
        `Failed to add room member testing data. Error: ${addRoomMemberResponse.error}`
      );
    }

    // add messages
    const addMessageResponse = await messagesManagerDB.storeMessage(
      fakeUserData.userID,
      fakeUserData.userName,
      RoomID,
      fakeUserData.fakeStatus as "MEMBER",
      fakeUserData.profileColor,
      fakeMessageData.message,
      fakeMessageData.messageId,
      fakeMessageData.messageDate
    );
    if ("error" in addMessageResponse) {
      throw new Error(
        `Failed to add message testing data. Error: ${addMessageResponse.error}`
      );
    }

    const response = await handler(restAPIEvent);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Room Deleted successfully");
    expect(response.statusCode).toBe(200);
    await checkRoomsOnUser(userID, RoomID, roomName, "Removed");
    await checkRoomsOnUser(fakeUserData.userID, RoomID, roomName, "Removed");
    remakeRoom = false;
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});
