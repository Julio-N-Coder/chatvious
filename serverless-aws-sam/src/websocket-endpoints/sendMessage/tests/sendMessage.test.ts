import { handler } from "../sendMessage.js";
import restAPIEventBase from "../../../../events/websocketApiCustomEvent.json";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterEach,
  beforeEach,
} from "@jest/globals";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { RoomConnectionDB } from "../../../types/types.js";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  roomInfoDB,
  roomConnectionDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);
const apiGatewayMock = mockClient(ApiGatewayManagementApiClient);

let restAPIEvent = restAPIEventBase as APIGatewayProxyWebsocketEventV2;
let restAPIEventCopy: APIGatewayProxyWebsocketEventV2;
const connectionId = restAPIEvent.requestContext.connectionId;

let RoomID = roomInfoDB.RoomID;

let messageId: string;
let messageDate: string;
const message = "This is a test message";

beforeAll(async () => {
  restAPIEvent.body = JSON.stringify({
    action: "sendmessage",
    message,
    RoomID,
  });
  restAPIEvent.requestContext.connectionId = connectionId;
  restAPIEvent.requestContext.routeKey = "sendmessage";

  restAPIEventCopy = JSON.parse(JSON.stringify(restAPIEvent));
});

beforeEach(async () => {
  ddbMock.on(GetCommand).resolves({
    $metadata,
    Item: roomConnectionDB,
  });
  ddbMock.on(UpdateCommand).resolves({
    $metadata,
  });
  ddbMock.on(QueryCommand).resolves({
    $metadata,
    Items: [roomConnectionDB] as RoomConnectionDB[],
  });
  ddbMock.on(PutCommand).resolves({
    $metadata,
    Attributes: {},
  });
  apiGatewayMock
    .on(PostToConnectionCommand)
    .resolves({ $metadata: { httpStatusCode: 200 } });
});

afterEach(async () => {
  ddbMock.reset();
  apiGatewayMock.reset();
  restAPIEvent = JSON.parse(JSON.stringify(restAPIEventCopy));
});

describe("A test for the custom joinRoom route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store message information correclty", async () => {
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);
    expect(response).toHaveProperty("body", "Message sent successfully");

    if (!response.messageId && !response.messageDate) {
      throw new Error("No message id or date in response during test");
    }
    messageId = response.messageId;
    messageDate = response.messageDate;

    expect(response).toHaveProperty("messageId", messageId);
    expect(response).toHaveProperty("messageDate", messageDate);

    // check whether the message is attempted to be stored
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  test("Should return correct error when message is missing from body", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID,
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Missing Message");
  });

  test("Should return correct error when RoomID is missing from body", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      message,
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Invalid RoomID");
  });

  test("Should return correct error when message is to long", async () => {
    restAPIEvent.body = JSON.stringify({
      action: "joinroom",
      RoomID,
      message:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".repeat(40) + "a", // 2001
    });
    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 400);
    expect(response).toHaveProperty("body", "Message too long");
  });
});
