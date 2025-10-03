import { handler } from "../rejectJoinRequest.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
  roomMemberDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

let RoomID = roomInfoDB.RoomID;

let requestingUser = structuredClone(userInfoDB);
let requestUserID = "z7574571-6cd1-4fbb-ba4f-43c39573729a";
requestingUser.userID = requestUserID;
let requestUserName = "requestUserName";
requestingUser.userName = requestUserName;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    userID: requestUserID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/rejectJoinRequest";
  restAPIEvent.resource = "/rooms/rejectJoinRequest";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("A test for the rejectJoinRequest route handler", () => {
  test("rejectJoinRequest route returns a successfull response and removes join request", async () => {
    ddbMock.on(GetCommand).resolves({
      $metadata,
      Item: roomMemberDB,
    });
    ddbMock.on(DeleteCommand).resolves({
      $metadata,
      Attributes: {},
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Join request rejected successfully");

    // check that the join request was attempted to be deleted
    expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(1);
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
