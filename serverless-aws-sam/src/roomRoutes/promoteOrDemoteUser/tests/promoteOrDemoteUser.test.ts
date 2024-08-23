import { handler } from "../promoteOrDemoteUser.js";
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
  clearDynamoDB,
} from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;
let newUser: UserInfo;

const roomName = "promoteDemoteTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let userPromotedDemoted: UserInfo;
let userPromotedDemotedID: string;
let userPromotedDemotedName: string;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

  // make a user for the person being promoted
  const createUserPromotedDemotedResponse = await userManager.createUser();
  if ("error" in createUserPromotedDemotedResponse) {
    throw new Error(
      `Failed to create user. Error: ${createUserPromotedDemotedResponse.error}`
    );
  }
  userPromotedDemoted = createUserPromotedDemotedResponse.newUser;
  userPromotedDemotedID = userPromotedDemoted.userID;
  userPromotedDemotedName = userPromotedDemoted.userName;

  // make a room for the user to be promoted from
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

  // insert the user being promoted into the room
  const addRoomMemberResponse = await roomManager.addRoomMember(
    RoomID,
    userPromotedDemotedID,
    userPromotedDemotedName,
    userPromotedDemoted.profileColor
  );
  if ("error" in addRoomMemberResponse) {
    throw new Error(
      `Failed to add room member. Error: ${addRoomMemberResponse.error}`
    );
  }

  restAPIEvent.body = JSON.stringify({
    userID: userPromotedDemotedID,
    RoomID,
    action: "PROMOTE",
  });
  restAPIEvent.path = "/rooms/promoteOrDemoteUser";
  restAPIEvent.resource = "/rooms/promoteOrDemoteUser";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

afterAll(async () => {
  await clearDynamoDB();
});

// promte then demote in one test
describe("A test to see if the promoteOrDemoteUser works correctly", () => {
  test("promoteOrDemoteUser route successfull promotes a User", async () => {
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Successfully Promoted User");

    // check whether user has been promoted
    const roomMemberResponse = await roomManager.fetchRoomMember(
      RoomID,
      userPromotedDemotedID
    );
    if ("error" in roomMemberResponse) {
      throw new Error(
        `Failed to fetch room member in test. Error: ${roomMemberResponse.error}`
      );
    }

    const promotedUser = roomMemberResponse.roomMember;
    expect(promotedUser).toHaveProperty("RoomUserStatus", "ADMIN");
  });

  test("promoteOrDemoteUser route successfull demotes a User", async () => {
    restAPIEvent.body = JSON.stringify({
      userID: userPromotedDemotedID,
      RoomID,
      action: "DEMOTE",
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Successfully Demoted User");

    // check whether user has been demoted
    const roomMemberResponse = await roomManager.fetchRoomMember(
      RoomID,
      userPromotedDemotedID
    );
    if ("error" in roomMemberResponse) {
      throw new Error(
        `Failed to fetch room member in test. Error: ${roomMemberResponse.error}`
      );
    }

    const promotedUser = roomMemberResponse.roomMember;
    expect(promotedUser).toHaveProperty("RoomUserStatus", "MEMBER");
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html"; // correct header is application/json
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID, userID and action should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });

  test("Body with RoomID and userID that are not string should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({
      userID: 134134,
      RoomID: 85872,
      action: "PROMOTE",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });

  test("Body with an invalide action should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({
      userID: userPromotedDemotedID,
      RoomID,
      action: "some random action",
    });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});
