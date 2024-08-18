import { handler } from "../fetchNewMessages.js";
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
import { messagesManagerDB } from "../../../models/messagesDB.js";
import { UserInfo, RoomInfoType, MessageKeys } from "../../../types/types.js";
import { newTestUser } from "../../../lib/libtest/handyTestUtils.js";

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.claims.sub;
const userName = restAPIEvent.requestContext.authorizer.claims.username;
let newUser: UserInfo;

const roomName = "promoteDemoteTestRoom";
let roomInfo: RoomInfoType;
let RoomID: string;

let LastEvaluatedKey: MessageKeys | false = false;

beforeAll(async () => {
  newUser = await newTestUser(userID, userName);

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

  // insert messages into the room
  let messageCount = 10;
  let errorCount = 0;
  let maxAllowedErrorCount = 4;
  for (let i = 0; i < messageCount; i++) {
    const storeMessageResponse = await messagesManagerDB.storeMessage(
      userID,
      userName,
      RoomID,
      "OWNER",
      newUser.profileColor,
      `This is a Test Message ${i}`
    );
    if ("error" in storeMessageResponse) {
      errorCount++;
      console.error(
        `Failed to store message. Error: ${storeMessageResponse.error}`
      );

      if (errorCount > maxAllowedErrorCount) {
        throw new Error(
          `Failed to store enough messages. ${errorCount} messages didn't store`
        );
      }
    } else {
      const currentTimestamp = storeMessageResponse.data.sentAt;
      const messageId = storeMessageResponse.data.messageId;

      if (i === maxAllowedErrorCount + 1) {
        LastEvaluatedKey = {
          PartitionKey: `ROOM#${RoomID}`,
          SortKey: `MESSAGES#DATE#${currentTimestamp}#MESSAGEID#${messageId}`,
        };
      }
    }
  }

  restAPIEvent.body = JSON.stringify({
    RoomID,
    LastEvaluatedKey,
  });
  restAPIEvent.path = "/rooms/fetchNewMessages";
  restAPIEvent.resource = "/rooms/fetchNewMessages";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

afterAll(async () => {
  // remove the created room which removes all other room resouces as well
  const deleteRoomResponse = await roomManager.deleteRoom(RoomID);
  if ("error" in deleteRoomResponse) {
    throw new Error(
      `Failed to clean up Room after test. Error: ${deleteRoomResponse.error}`
    );
  }

  // delete the user
  const deleteUserResponse = await userManager.deleteUser(userID);
  if ("error" in deleteUserResponse) {
    throw new Error(
      `Failed to clean up user after test. Error: ${deleteUserResponse.error}`
    );
  }
});

describe("tests to see if the fetchNewMessages route works correctly", () => {
  test("Route Successfully fetches new messages with the LastEvaluatedKey", async () => {
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("LastEvaluatedKey");
    expect(body).toHaveProperty("message", "Messages fetched successfully");
    expect(body).toHaveProperty("data");
    expect(body.data[0]).toHaveProperty("messageId");
    expect(body.data[0]).toHaveProperty("RoomID", RoomID);
    expect(body.data[0]).toHaveProperty("userID", userID);
    expect(body.data[0]).toHaveProperty("userName", userName);
    expect(body.data[0]).toHaveProperty("RoomUserStatus", "OWNER");
    expect(body.data[0]).toHaveProperty("profileColor", newUser.profileColor);
  });

  test("Incorrect Content-Type header should return the correct Error", async () => {
    restAPIEvent.headers["Content-Type"] = "text/html";
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Invalid Content Type");
  });

  test("Body without RoomID and LastEvaluatedKey should return the correct Error", async () => {
    restAPIEvent.body = JSON.stringify({ random: "someRandomText" });
    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body.error).toBe("Bad Request");
  });
});
