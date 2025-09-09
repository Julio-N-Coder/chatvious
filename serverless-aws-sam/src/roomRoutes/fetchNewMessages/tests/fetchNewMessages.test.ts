import { handler } from "../fetchNewMessages.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
  roomMemberDB,
  messageDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

const userID = userInfoDB.userID;
const userName = userInfoDB.userName;

let RoomID = roomInfoDB.RoomID;

let LastEvaluatedKey = {
  PartitionKey: `ROOM#${RoomID}`,
  SortKey: "MESSAGES#DATE#${currentTimestamp}#MESSAGEID#${messageId}",
};

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    RoomID,
    LastEvaluatedKey,
  });
  restAPIEvent.path = "/rooms/fetchNewMessages";
  restAPIEvent.resource = "/rooms/fetchNewMessages";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("tests to see if the fetchNewMessages route works correctly", () => {
  test("Route Successfully fetches new messages with the LastEvaluatedKey", async () => {
    ddbMock.on(GetCommand).resolves({
      $metadata,
      Item: roomMemberDB,
    });
    ddbMock.on(QueryCommand).resolves({
      $metadata,
      Count: 5,
      Items: [messageDB, messageDB, messageDB, messageDB, messageDB],
      ScannedCount: 5,
    });

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
    expect(body.data[0]).toHaveProperty(
      "profileColor",
      userInfoDB.profileColor
    );
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
