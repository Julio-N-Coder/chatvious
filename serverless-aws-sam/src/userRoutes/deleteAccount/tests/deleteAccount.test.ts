import { handler } from "../deleteAccount.js";
import restAPIEventBase from "../../../../events/restAPIEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterEach,
  beforeEach,
} from "@jest/globals";
import { APIGatewayProxyEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  userInfoDB,
  roomInfoDB,
  roomMemberDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

let restAPIEvent: APIGatewayProxyEvent = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
let restAPIEventCopy: APIGatewayProxyEvent;

let joinRoomInfoDB = structuredClone(roomInfoDB);
let joinRoomName = "deleteAcountJoinedRoom";
let joinRoomID = "z7574571-6cd1-4fbb-ba4f-43c39573729a";
joinRoomInfoDB.roomName = joinRoomName;
joinRoomInfoDB.RoomID = joinRoomID;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({});
  restAPIEvent.path = "/deleteAccount";
  restAPIEvent.resource = "/deleteAccount";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

beforeEach(async () => {
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
});

describe("Tests for the deleteAccount route", () => {
  test("should Delete the users account with associated resouces", async () => {
    ddbMock.on(GetCommand).resolves({
      $metadata,
      Item: {
        joinedRooms: [{ RoomID: joinRoomID, roomName: joinRoomName }],
        ownedRooms: userInfoDB.ownedRooms,
      },
    });
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
    expect(response).toHaveProperty("statusCode", 200);
    expect(response).toHaveProperty("multiValueHeaders");
    expect(response.multiValueHeaders).toHaveProperty("Set-Cookie");

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "successfully Deleted Account");
  });
});
