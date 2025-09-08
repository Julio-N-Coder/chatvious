import { handler } from "../joinRoom.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
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
  restAPIEvent.path = "/rooms/joinRoom";
  restAPIEvent.resource = "/rooms/joinRoom";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("A test suite to test whether a room join request is successfully sent", () => {
  test("joinRoom return a success response with correct input", async () => {
    ddbMock.on(GetCommand).callsFake((input) => {
      if (input.Key.SortKey === "METADATA") {
        return Promise.resolve({
          $metadata,
          Item: roomInfoDB,
        });
      } else if (input.Key.SortKey.startsWith("MEMBERS")) {
        return Promise.resolve({
          $metadata,
          Item: undefined,
        });
      } else if (input.Key.SortKey.startsWith("JOIN_REQUESTS")) {
        return Promise.resolve({
          $metadata,
          Item: undefined,
        });
      }

      return Promise.resolve({
        $metadata,
        Item: userInfoDB,
      });
    });

    // sendJoinRequest
    ddbMock.on(PutCommand).resolves({
      $metadata,
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Successfully sent Join Request to the Room");

    // check if the join request attempted to be stored
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  test("A Request sent to the Room should return the correct error", async () => {
    ddbMock.on(GetCommand).callsFake((input) => {
      if (input.Key.SortKey === "METADATA") {
        return Promise.resolve({
          $metadata,
          Item: roomInfoDB,
        });
      } else if (input.Key.SortKey.startsWith("MEMBERS")) {
        return Promise.resolve({
          $metadata,
          Item: undefined,
        });
      }

      // JOIN_REQUESTS
      return Promise.resolve({
        $metadata,
        Item: joinRequestDB,
      });
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(403);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty(
      "error",
      "You have already sent a join Request"
    );
  });

  test("To Many Members in the Room should return the corect error", async () => {
    ddbMock.on(GetCommand).resolves({
      $metadata,
      Item: {
        ...roomInfoDB,
        roomMemberCount: 20,
      },
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(403);

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("error", "Room is full");
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
