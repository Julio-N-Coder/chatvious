import { handler } from "../acceptJoinRequest.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: typeof restAPIEventBase = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: typeof restAPIEventBase;

let RoomID = roomInfoDB.RoomID;

let requestingUser = structuredClone(userInfoDB);
let requestUserID = "z7574571-6cd1-4fbb-ba4f-43c39573729a";
let requestUserName = "requestUserName";
requestingUser.userID = requestUserID;
requestingUser.userName = requestUserName;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    userID: requestUserID,
    RoomID,
  });
  restAPIEvent.path = "/rooms/acceptJoinRequest";
  restAPIEvent.resource = "/rooms/acceptJoinRequest";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

afterEach(async () => {
  ddbMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("Test to see if accepting the join request works", () => {
  test("Should return a successfull response, add the user to the room and update the rooms they are joined in", async () => {
    ddbMock.on(GetCommand).callsFake((input) => {
      if (input.Key.PartitionKey === userInfoDB.PartitionKey) {
        return Promise.resolve({
          $metadata,
          Item: userInfoDB,
        });
      }

      return Promise.resolve({
        $metadata,
        Item: requestingUser,
      });
    });
    ddbMock.on(DeleteCommand).resolves({
      $metadata,
      Attributes: {},
    });
    ddbMock.on(PutCommand).resolves({
      $metadata,
    });
    ddbMock.on(UpdateCommand).resolves({
      $metadata,
      Attributes: {},
    });

    const response = await handler(restAPIEvent);
    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.message).toBe("Join request accepted successfully");

    // check if the user was added to the room
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
    // check if memberCount was called and update to rooms on user
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(2);
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
