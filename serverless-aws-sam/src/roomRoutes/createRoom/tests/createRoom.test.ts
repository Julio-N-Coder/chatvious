import { handler } from "../createRoom.js";
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
import { UserInfo } from "../../../types/types.js";
import { newTestUser } from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
let newUser: UserInfo;

const roomName = "createRoomTestRoom";
let RoomID: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  restAPIEvent.body = JSON.stringify({
    roomName,
  });
  restAPIEvent.path = "/rooms/createRoom";
  restAPIEvent.resource = "/rooms/createRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // delete the room member entry made
  const removeRoomMemberResponse = await roomManager.removeRoomMember(
    RoomID,
    userID
  );
  if ("error" in removeRoomMemberResponse) {
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
  if ("error" in deleteRoomResponse) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }
});

describe("A test suite to see if the createRoom route works correctly", () => {
  test("createRoom Route returns a successfull response, makes the room, updates the rooms on user, and adds user to room as Owner", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("roomInfo");
    RoomID = body.roomInfo.RoomID;

    expect(body.message).toBe("Room Created");
    expect(body.roomInfo.roomName).toBe(roomName);

    // check if the room is created
    const fetchRoomResponse = await roomManager.fetchRoom(RoomID);
    if ("error" in fetchRoomResponse) {
      throw new Error(
        `Failed to fetch room. Error: ${fetchRoomResponse.error}`
      );
    }

    expect(fetchRoomResponse).toHaveProperty("statusCode", 200);
    expect(fetchRoomResponse).toHaveProperty("message", "Room Found");
    expect(fetchRoomResponse).toHaveProperty("roomInfo");
    expect(fetchRoomResponse.roomInfo).toHaveProperty("RoomID", RoomID);
    expect(fetchRoomResponse.roomInfo).toHaveProperty("roomName", roomName);
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without roomName should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room Name is required");
  });

  test("createRoom should return the correct Error when roomName is less than 3 characters", async () => {
    restAPIEvent.body = JSON.stringify({ roomName: "ab" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room Name must be at least 3 characters");
  });

  test("createRoom should return the correct Error when roomName is greater than 20 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      roomName: "someRandomTextGreaterThan25",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room Name must be less than 20 characters");
  });
});
