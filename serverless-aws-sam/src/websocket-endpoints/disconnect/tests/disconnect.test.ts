import { handler } from "../disconnect.js";
import restAPIEventBase from "../../../../events/websocketApiDisconnectEvent.json";
import { describe, test, expect, beforeAll, afterEach } from "@jest/globals";
import { APIGatewayWebSocketDisconnectEvent } from "../../../types/types.js";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import {
  $metadata,
  initialConnectionDB,
} from "../../../lib/libtest/testData.js";

const ddbMock = mockClient(DynamoDBDocumentClient);

const restAPIEvent = restAPIEventBase as APIGatewayWebSocketDisconnectEvent;
const connectionId = restAPIEvent.requestContext.connectionId;

beforeAll(async () => {
  restAPIEvent.requestContext.connectionId = connectionId;
});

afterEach(async () => {
  ddbMock.reset();
});

describe("A test for the disconnect route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly remove connection information", async () => {
    ddbMock.on(DeleteCommand).resolves({
      $metadata,
      Attributes: initialConnectionDB,
    });

    const response = await handler(restAPIEvent);
    expect(response).toHaveProperty("statusCode", 200);

    expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(2);
  });
});
