import { handler } from "../connect.js";
import restAPIEventBase from "../../../../events/websocketApiConnectEvent.json";
import { initialConectDBWSManager } from "../../../models/web-socket-messages.js";
import { describe, test, expect, afterAll } from "@jest/globals";
import { APIGatewayWebSocketConnectEvent } from "../../../types/types.js";
import { clearDynamoDB } from "../../../lib/libtest/handyTestUtils.js";

const restAPIEvent: APIGatewayWebSocketConnectEvent = JSON.parse(
  JSON.stringify(restAPIEventBase)
);
const userID = restAPIEvent.requestContext.authorizer?.sub as string;
const connectionId = restAPIEvent.requestContext.connectionId;

afterAll(async () => {
  await clearDynamoDB();
});

describe("A test for the connect route on the api gateway websocket", () => {
  test("Should return a successfull response and correctly store initial connection information", async () => {
    const connectResponse = await handler(restAPIEvent);
    expect(connectResponse.statusCode).toBe(200);

    const initialConnection =
      await initialConectDBWSManager.fetchInitialConnection(connectionId);
    if ("error" in initialConnection) {
      throw new Error(
        `Error fetching initial connection. Error: ${initialConnection.error}`
      );
    }

    const initialConnectionData = initialConnection.data;
    expect(initialConnectionData.connectionId).toBe(connectionId);
    expect(initialConnectionData.userID).toBe(userID);
  });
});
