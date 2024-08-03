import { handler } from "../leaveRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from "@jest/globals";
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { UserInfo, RoomInfoType } from "../../../types/types.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

const roomName = "leaveRoomTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let roomOwnerUser: UserInfo;
let roomOwnerUserID: string;
let roomOwnerUserName: string;

beforeAll(async () => {
  // check if there is a user, delete them to have the same info if they exist
  const fetchUserInfoResponse = await userManager.fetchUserInfo(userID);
  if ("error" in fetchUserInfoResponse) {
    if (fetchUserInfoResponse.error === "Failed to Get User Info") {
      throw new Error("Failed to fetch user info");
    }
  } else {
    const deleteUserResponse = await userManager.deleteUser(userID);
    if ("error" in deleteUserResponse) {
      throw new Error(
        `Failed to clean up before test. Error: ${deleteUserResponse.error}`
      );
    }
  }

  const createUserResponse = await userManager.createUser(
    userID,
    userName,
    email
  );
  if ("error" in createUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserResponse.error}`
    );
  }
  newUser = createUserResponse.newUser;

  // make a user who will be the room owner
  const createroomOwnerUserResponse = await userManager.createUser();
  if ("error" in createroomOwnerUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createroomOwnerUserResponse.error}`
    );
  }
  roomOwnerUser = createroomOwnerUserResponse.newUser;
  roomOwnerUserID = roomOwnerUser.userID;
  roomOwnerUserName = roomOwnerUser.userName;

  // make a room for the user to join
  const createRoomResponse = await roomManager.makeRoom(
    roomOwnerUserID,
    roomOwnerUserName,
    roomName,
    roomOwnerUser.profileColor
  );
  if ("error" in createRoomResponse) {
    throw new Error(
      `Failed to create room. Error: ${createRoomResponse.error}`
    );
  }
  roomInfo = createRoomResponse.roomInfo;
  RoomID = roomInfo.RoomID;

  // include user in room
  const addRoomMemberResponse = await roomManager.addRoomMember(
    RoomID,
    userID,
    userName,
    newUser.profileColor
  );
  if ("error" in addRoomMemberResponse) {
    throw new Error(
      `Failed to add user to room. Error: ${addRoomMemberResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
  restAPIEvent.path = "/rooms/leaveRoom";
  restAPIEvent.resource = "/rooms/leaveRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // delete the users room member entries
  const removeRoomMemberResponse = await roomManager.removeRoomMember(
    RoomID,
    userID
  );
  if (
    "error" in removeRoomMemberResponse &&
    removeRoomMemberResponse.error !== "Bad Request"
  ) {
    throw new Error(
      `Failed to clean up RoomMember after test. Error: ${removeRoomMemberResponse.error}`
    );
  }

  const removeRoomOwnerUserRoomMemberResponse =
    await roomManager.removeRoomMember(RoomID, roomOwnerUserID);
  if ("error" in removeRoomOwnerUserRoomMemberResponse) {
    throw new Error(
      `Failed to clean up requesting RoomMember after test. Error: ${removeRoomOwnerUserRoomMemberResponse.error}`
    );
  }

  // delete the users we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }

  const deleteRoomOwnerUserResponse = await userManager.deleteUser(
    roomOwnerUserID
  );
  if ("error" in deleteRoomOwnerUserResponse) {
    throw new Error(
      `Failed to clean up requesting user after test. Error: ${deleteRoomOwnerUserResponse.error}`
    );
  }

  // remove the created room
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if ("error" in deleteRoomResponse) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }
});

describe("A test To see if the leaveRoom Route works correctly", () => {
  test("leaveRoom route should return a successfull response with correct input", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Successfully Left the room");
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
