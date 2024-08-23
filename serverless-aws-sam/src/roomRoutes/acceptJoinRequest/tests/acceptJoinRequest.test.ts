import { handler } from "../acceptJoinRequest.js";
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
import {
  newTestUser,
  checkRoomsOnUser,
} from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;
let newUser: UserInfo;

const roomName = "acceptJoinRequestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let requestingUser: UserInfo;
let requestUserID: string;
let requestUserName: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  // make a user for the person making the request
  const createRequestingUserResponse = await userManager.createUser();
  if ("error" in createRequestingUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createRequestingUserResponse.error}`
    );
  }
  requestingUser = createRequestingUserResponse.newUser;
  requestUserID = requestingUser.userID;
  requestUserName = requestingUser.userName;

  // make a room for the user to join
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

  // send a join request to the room by requesting user
  const sendJoinRequestResponse = await roomManager.sendJoinRequest(
    requestUserName,
    requestUserID,
    roomName,
    RoomID,
    requestingUser.profileColor
  );
  if ("error" in sendJoinRequestResponse) {
    throw new Error(
      `Failed to send join request. Error: ${sendJoinRequestResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    userID: requestUserID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/acceptJoinRequest";
  restAPIEvent.resource = "/rooms/acceptJoinRequest";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // remove the created room which removes all related room info
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if ("error" in deleteRoomResponse) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }

  // delete the users we created
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }

  const deleteRequestingUserResponse = await userManager.deleteUser(
    requestUserID
  );
  if ("error" in deleteRequestingUserResponse) {
    throw new Error(
      `Failed to clean up requesting user after test. Error: ${deleteRequestingUserResponse.error}`
    );
  }
});

describe("Test to see if accepting the join request works", () => {
  test("Should return a successfull response, add the user to the room and update the rooms they are joined in", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Join request accepted successfully");

    // check if the user was added to the room
    const fetchRoomMemberResponse = await roomManager.fetchRoomMember(
      RoomID,
      requestUserID
    );
    if ("error" in fetchRoomMemberResponse) {
      throw new Error(
        `Failed to fetch room member. Error: ${fetchRoomMemberResponse.error}`
      );
    }

    expect(fetchRoomMemberResponse).toHaveProperty("statusCode", 200);
    expect(fetchRoomMemberResponse).toHaveProperty("roomMember");
    expect(fetchRoomMemberResponse.roomMember).toHaveProperty(
      "userName",
      requestUserName
    );
    expect(fetchRoomMemberResponse.roomMember).toHaveProperty(
      "userID",
      requestUserID
    );
    expect(fetchRoomMemberResponse.roomMember).toHaveProperty("RoomID", RoomID);
    expect(fetchRoomMemberResponse.roomMember).toHaveProperty(
      "RoomUserStatus",
      "MEMBER"
    );

    await checkRoomsOnUser(requestUserID, RoomID, roomName, "Joined");

    // check if memberCount was increased
    const fetchRoomResponse = await roomManager.fetchRoom(RoomID);
    if ("error" in fetchRoomResponse) {
      throw new Error(
        `Failed to fetch room. Error: ${fetchRoomResponse.error}`
      );
    }

    const memberCount = fetchRoomResponse.roomInfo.roomMemberCount;
    expect(memberCount).toBe(roomInfo.roomMemberCount + 1);
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID and userID should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});
