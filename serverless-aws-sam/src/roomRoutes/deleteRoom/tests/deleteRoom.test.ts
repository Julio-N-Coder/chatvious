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
import { userManager } from "../../../models/users.js";
import { roomManager } from "../../../models/rooms.js";
import { UserInfo, RoomInfoType } from "../../../types/types.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
let newUser: UserInfo;

const roomName = "deleteRoomTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

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

  const createUserResponse = await userManager.createUser(userID, userName);
  if ("error" in createUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserResponse.error}`
    );
  }
  newUser = createUserResponse.newUser;

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

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // delete the user room member entries
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

  // delete the user we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }

  // remove the created room
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if (
    "error" in deleteRoomResponse &&
    deleteRoomResponse.error !== "Bad Request"
  ) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }
});

describe("A Test for The deleteRoom Route", () => {
  test("Should return a successfull response with correct input", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    expect(JSON.parse(response.body).message).toBe("Room Deleted successfully");
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
