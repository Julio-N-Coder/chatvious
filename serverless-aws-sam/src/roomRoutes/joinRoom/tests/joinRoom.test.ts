import { handler } from "../joinRoom.js";
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
import {
  roomManager,
  joinRequestManager,
  roomUsersManager,
} from "../../../models/rooms.js";
import { RoomInfoType, UserInfo } from "../../../types/types.js";
import {
  newTestUser,
  clearDynamoDB,
} from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;
let newUser: UserInfo;

const roomName = "joinRoomTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let roomUserOwner: UserInfo;
let roomUserID: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  // make a user to be able to make a room
  const createRequestingUserResponse = await userManager.createUser();
  if ("error" in createRequestingUserResponse) {
    throw new Error(
      `Failed to create user. Error: ${createRequestingUserResponse.error}`
    );
  }
  roomUserOwner = createRequestingUserResponse.newUser;
  roomUserID = roomUserOwner.userID;

  // make a room for the user to send a join request to
  const createRoomResponse = await roomManager.makeRoom(
    roomUserID,
    roomUserOwner.userName,
    roomName,
    roomUserOwner.profileColor
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
  restAPIEvent.path = "/rooms/joinRoom";
  restAPIEvent.resource = "/rooms/joinRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

let keepJoinRequest = false;
afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));

  // delete the sent join request
  if (keepJoinRequest) return;
  const removeJoinRequestResponse = await joinRequestManager.removeJoinRequest(
    RoomID,
    userID
  );
  if (
    "error" in removeJoinRequestResponse &&
    removeJoinRequestResponse.error !== "Bad Request"
  ) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${removeJoinRequestResponse.error}`
    );
  }
});

afterAll(async () => {
  await clearDynamoDB();
});

describe("A test suite to test whether a room join request is successfully sent", () => {
  test("joinRoom return a success response with correct input", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Successfully sent Join Request to the Room");

    // check if the join request was sent to the room
    const fetchJoinRequestResponse = await joinRequestManager.fetchJoinRequest(
      RoomID,
      userID
    );
    if ("error" in fetchJoinRequestResponse) {
      throw new Error(
        `Failed to check if join request was sent. Error: ${fetchJoinRequestResponse.error}`
      );
    }

    expect(fetchJoinRequestResponse).toHaveProperty("statusCode", 200);
    expect(fetchJoinRequestResponse).toHaveProperty(
      "message",
      "Join Request Fetched"
    );
    expect(fetchJoinRequestResponse).toHaveProperty("joinRequest");
    expect(fetchJoinRequestResponse.joinRequest).toHaveProperty(
      "RoomID",
      RoomID
    );
    expect(fetchJoinRequestResponse.joinRequest).toHaveProperty(
      "fromUserID",
      userID
    );
    expect(fetchJoinRequestResponse.joinRequest).toHaveProperty(
      "fromUserName",
      userName
    );
    expect(fetchJoinRequestResponse.joinRequest).toHaveProperty(
      "roomName",
      roomName
    );

    keepJoinRequest = true;
  });

  test("A Request sent to the Room should return the correct error", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(403);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty(
      "error",
      "You have already sent a join Request"
    );

    keepJoinRequest = false;
  });

  test("To Many Members in the Room should return the corect error", async () => {
    const addAmount = 19;
    const addMemberCount = await roomUsersManager.addSubMemberCount(
      RoomID,
      addAmount
    );
    if ("error" in addMemberCount) {
      throw new Error(
        `Failed to incease the member count of the room. Error: ${addMemberCount.error}`
      );
    }

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(403);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("error", "Room is full");

    const subMemberCount = await roomUsersManager.addSubMemberCount(
      RoomID,
      -addAmount
    );
    if ("error" in addMemberCount) {
      throw new Error(
        `Failed to decrease the member count of the room. Error: ${addMemberCount.error}`
      );
    }
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
    expect(body.error).toBe("Room ID is required");
  });

  test("joinRoom should return the correct Error when RoomID is less than 20 characters", async () => {
    restAPIEvent.body = JSON.stringify({ RoomID: "e1c5d65a-cbef-4518" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room ID must be at least 20 characters");
  });

  test("joinRoom should return the correct Error when RoomID is greater than 50 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      RoomID: "71fab644-0049-47ee-b27b-bc83110c398c-e1c5d65a-cbef-4518",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Room ID must be less than 50 characters");
  });
});
