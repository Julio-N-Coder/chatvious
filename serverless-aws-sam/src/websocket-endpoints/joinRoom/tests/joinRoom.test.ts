import { handler } from "../joinRoom.js";
import restAPIEventBase from "../../../../events/websocketApiCustomEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  roomInfoDB,
  roomMemberDB,
  initialConnectionDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

const restAPIEvent = restAPIEventBase as APIGatewayProxyWebsocketEventV2;
const connectionId = restAPIEvent.requestContext.connectionId;

let RoomID = roomInfoDB.RoomID;

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    action: "joinroom",
    RoomID,
  });
  restAPIEvent.requestContext.connectionId = connectionId;
  restAPIEvent.requestContext.routeKey = "joinroom";
});

beforeEach(async () => {
  ddbMock.on(UpdateCommand).resolves({
    $metadata,
    Attributes: {},
  });
  ddbMock.on(PutCommand).resolves({
    $metadata,
  });
});

afterEach(async () => {
  ddbMock.reset();
});

describe("A test for the custom joinRoom route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store connection information correclty", async () => {
    ddbMock.on(GetCommand).callsFake((input) => {
      if (input.Key.PartitionKey === "CONNECTION_INFO") {
        return Promise.resolve({
          $metadata,
          Item: initialConnectionDB,
        });
      }

      return Promise.resolve({
        $metadata,
        Item: roomMemberDB,
      });
    });

    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);
    if (!response.body) {
      throw new Error("No body in response");
    }

    const body = JSON.parse(response.body);
    expect(body).toHaveProperty("message", "Joined Room Successfully");

    // check if the connection information is attempted to be stored correctly
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  test("Should return correct error when RoomID is missing from body", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Missing RoomID");
  });

  test("Should return correct error when RoomID is not a string", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID: true,
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });

  test("Should return correct error when RoomID is less than 20 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID: "RoomIDLessThan20",
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });

  test("Should return correct error when RoomID is greater than 50 characters", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID: "AVeryVeryVeryLongRoomIDThatIsGreaterThan50Characters",
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });
});
