import { handler } from "../leaveRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { RoomMemberDB } from "../../../types/types.js";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  roomInfoDB,
  roomMemberDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

let RoomID = roomInfoDB.RoomID;
const roomName = roomInfoDB.roomName;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    RoomID,
  });
  restAPIEvent.path = "/rooms/leaveRoom";
  restAPIEvent.resource = "/rooms/leaveRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("A test To see if the leaveRoom Route works correctly", () => {
  test("leaveRoom route should return a successfull response and removes roomMember and room on user", async () => {
    ddbMock.on(GetCommand).callsFake((input) => {
      if (input.Key.PartitionKey === roomMemberDB.PartitionKey) {
        return Promise.resolve({
          $metadata,
          Item: {
            ...roomMemberDB,
            RoomUserStatus: "MEMBER",
          } as RoomMemberDB,
        });
      }

      return Promise.resolve({
        $metadata,
        Item: { joinedRooms: [{ RoomID, roomName }], ownedRooms: [] },
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

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Successfully Left the room");

    // check if the user is attempted to be removed from the room
    expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(1);

    // check if room on user was attempted to be removed
    // check if member count was attempted to be decremented
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(2);
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
