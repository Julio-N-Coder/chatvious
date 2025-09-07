import { handler } from "../createRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { UserInfoDBResponse } from "../../../types/types.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = restAPIEvent.requestContext.authorizer.sub;
const userName = restAPIEvent.requestContext.authorizer.username;

const roomName = "createRoomTestRoom";

const $metadata = {
  httpStatusCode: 200,
  requestId: "c7574571-6cd1-4fbb-ba4f-43c39573729a",
  attempts: 1,
  totalRetryDelay: 0,
};

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    roomName,
  });
  restAPIEvent.path = "/rooms/createRoom";
  restAPIEvent.resource = "/rooms/createRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("A test suite to see if the createRoom route works correctly", () => {
  test("createRoom Route returns a successfull response, makes the room, updates the rooms on user, and adds user to room as Owner", async () => {
    ddbMock.on(GetCommand).resolves({
      $metadata,
      Item: {
        PartitionKey: `USER#${userID}`,
        SortKey: "PROFILE",
        userID,
        userName,
        hashedPassword: "password",
        ownedRooms: [],
        joinedRooms: [],
        profileColor: "green",
      } as UserInfoDBResponse,
    });

    ddbMock.on(UpdateCommand).callsFake((input) => {
      if (input.Key.PartitionKey === "LIMITS") {
        return Promise.resolve({
          $metadata,
        });
      }

      return Promise.resolve({
        $metadata,
      });
    });

    ddbMock.on(PutCommand).resolves({
      $metadata,
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("roomInfo");

    expect(body.message).toBe("Room Created");
    expect(body.roomInfo.roomName).toBe(roomName);
    expect(body.roomInfo).toHaveProperty("RoomID");
    expect(body.roomInfo).toHaveProperty("RoomID");
    expect(body.roomInfo).toHaveProperty("createdAt");
    expect(body.roomInfo).toHaveProperty("roomMemberCount", 1);
    expect(body.roomInfo).toHaveProperty("messageCount", 0);
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
