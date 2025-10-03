import { handler } from "../connect.js";
import restAPIEventBase from "../../../../events/websocketApiConnectEvent.json";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { APIGatewayWebSocketConnectEvent } from "../../../types/types.js";
import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  initialConnectionDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

const restAPIEvent: APIGatewayWebSocketConnectEvent = JSON.parse(
  JSON.stringify(restAPIEventBase)
);

beforeEach(async () => {
  ddbMock.on(PutCommand).resolves({
    $metadata,
  });
});

afterEach(async () => {
  ddbMock.reset();
});

describe("A test for the connect route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store initial connection information", async () => {
    ddbMock.on(GetCommand).resolves({
      $metadata,
      Item: initialConnectionDB,
    });

    const connectResponse = await handler(restAPIEvent);
    expect(connectResponse.statusCode).toBe(200);
  });
});
