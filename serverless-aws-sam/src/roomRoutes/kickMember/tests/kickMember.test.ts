import { handler } from "../kickMember.js";
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

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
const email = restAPIEvent.requestContext.authorizer.claims.email;
let newUser: UserInfo;

const roomName = "kickMemberTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let userBeingKicked: UserInfo;
let userBeingKickedID: string;
let userBeingKickedName: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  // make a user for the person being kicked
  const createuserBeingKickedResponse = await userManager.createUser();
  if ("error" in createuserBeingKickedResponse) {
    throw new Error(
      `Failed to create user. Error: ${createuserBeingKickedResponse.error}`
    );
  }
  userBeingKicked = createuserBeingKickedResponse.newUser;
  userBeingKickedID = userBeingKicked.userID;
  userBeingKickedName = userBeingKicked.userName;

  // make a room for the user to be kicked from
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

  // insert the user being kicked into the room
  const addRoomMemberResponse = await roomManager.addRoomMember(
    RoomID,
    userBeingKickedID,
    userBeingKickedName,
    userBeingKicked.profileColor
  );
  if ("error" in addRoomMemberResponse) {
    throw new Error(
      `Failed to add room member. Error: ${addRoomMemberResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    userID: userBeingKickedID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/kickMember";
  restAPIEvent.resource = "/rooms/kickMember";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

// cleanups
afterAll(async () => {
  // remove the created room
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

  const deleteUserBeingKickedResponse = await userManager.deleteUser(
    userBeingKickedID
  );
  if ("error" in deleteUserBeingKickedResponse) {
    throw new Error(
      `Failed to clean up requesting user after test. Error: ${deleteUserBeingKickedResponse.error}`
    );
  }
});

// make sure to test room user status as well
describe("Test if kickMember route kicks the user from the chat room", () => {
  test("kickMember route returns successfull response and removes member", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("User Successfully Kicked");

    // check if member has been kicked
    const fetchRoomMemberResponse = await roomManager.fetchRoomMember(
      RoomID,
      userBeingKickedID
    );
    if (
      "error" in fetchRoomMemberResponse &&
      fetchRoomMemberResponse.error !== "Bad Request"
    ) {
      throw new Error(
        `Failed to fetch roomMember in test. Error: ${fetchRoomMemberResponse.error}`
      );
    }

    expect(fetchRoomMemberResponse).toHaveProperty("statusCode", 400);
    expect(fetchRoomMemberResponse).toHaveProperty("error", "Bad Request");

    await checkRoomsOnUser(userBeingKickedID, RoomID, roomName, "Removed");

    // check if memberCount was decreased
    const fetchRoomResponse = await roomManager.fetchRoom(RoomID);
    if ("error" in fetchRoomResponse) {
      throw new Error(
        `Failed to fetch room. Error: ${fetchRoomResponse.error}`
      );
    }

    const memberCount = fetchRoomResponse.roomInfo.roomMemberCount;
    expect(memberCount).toBe(1);
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
