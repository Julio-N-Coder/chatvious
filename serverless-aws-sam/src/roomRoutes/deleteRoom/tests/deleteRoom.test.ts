import { handler } from "../deleteRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterEach,
  beforeEach,
} from "@jest/globals";
import { BaseKeys } from "../../../types/types.js";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
  roomMemberDB,
  messageDB,
  joinRequestDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

let RoomID = roomInfoDB.RoomID;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
  restAPIEvent.path = "/rooms/deleteRoom";
  restAPIEvent.resource = "/rooms/deleteRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

beforeEach(async () => {
  ddbMock.on(GetCommand).callsFake((input) => {
    if (input.Key.PartitionKey === roomMemberDB.PartitionKey) {
      return Promise.resolve({
        $metadata,
        Item: roomMemberDB,
      });
    }

    return Promise.resolve({
      $metadata,
      Item: {
        joinedRooms: userInfoDB.joinedRooms,
        ownedRooms: userInfoDB.ownedRooms,
      },
    });
  });
  ddbMock.on(DeleteCommand).resolves({
    $metadata,
    Attributes: {},
  });
  ddbMock.on(UpdateCommand).resolves({
    $metadata,
    Attributes: {},
  });
});

afterEach(async () => {
  ddbMock.reset();

  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
});

describe("A Test for The deleteRoom Route", () => {
  test("Should return a successfull response and deletes the room", async () => {
    ddbMock.on(QueryCommand).callsFake((input) => {
      if (input.ExpressionAttributeValues[":sortDate"] === "JOIN_REQUESTS#") {
        return Promise.resolve({
          $metadata,
          Count: 0,
          Items: [],
          ScannedCount: 0,
        });
      } else if (
        input.ExpressionAttributeValues[":RoomMembersPrefix"] === "MEMBERS#"
      ) {
        return Promise.resolve({
          $metadata,
          Count: 1,
          Items: [roomMemberDB],
          ScannedCount: 1,
        });
      }
      return Promise.resolve({
        $metadata,
        Count: 0,
        Items: [],
        ScannedCount: 0,
      });
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe("Room Deleted successfully");

    // check if room was attempted to be deleted
    // Check if room member was attempted to be deleted
    expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(2);
  });

  test("Should correctly delete room with multiple resouces", async () => {
    ddbMock.on(QueryCommand).callsFake((input) => {
      if (input.ExpressionAttributeValues[":sortDate"] === "JOIN_REQUESTS#") {
        return Promise.resolve({
          $metadata,
          Count: 1,
          Items: [
            {
              PartitionKey: joinRequestDB.PartitionKey,
              SortKey: joinRequestDB.SortKey,
            },
          ] as BaseKeys[],
          ScannedCount: 1,
        });
      } else if (
        input.ExpressionAttributeValues[":RoomMembersPrefix"] === "MEMBERS#"
      ) {
        return Promise.resolve({
          $metadata,
          Count: 2,
          Items: [roomMemberDB, roomMemberDB],
          ScannedCount: 2,
        });
      }

      return Promise.resolve({
        $metadata,
        Count: 1,
        Items: [messageDB],
        ScannedCount: 1,
      });
    });
    ddbMock.on(BatchWriteCommand).resolves({
      $metadata,
      UnprocessedItems: {},
    });

    const response = await handler(restAPIEvent);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Room Deleted successfully");
    expect(response.statusCode).toBe(200);
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
