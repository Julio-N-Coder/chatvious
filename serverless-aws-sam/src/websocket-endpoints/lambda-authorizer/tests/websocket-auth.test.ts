import { handler } from "../websocket-auth.js";
import { jest, describe, test, expect, afterEach } from "@jest/globals";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import wsRequestAuthorizerEventBase from "../../../../events/wsRequestAuthorizerEvent.json";
import {
  APIGatewayWebSocketAuthorizerEvent,
  LambdaAuthorizerClaims,
} from "../../../types/types.js";
import { buildPolicy } from "../../../lib/handyUtils.js";

let wsRequestAuthorizerEvent: APIGatewayWebSocketAuthorizerEvent = JSON.parse(
  JSON.stringify(wsRequestAuthorizerEventBase)
);

let access_token = "FakeAccessToken";
let id_token = "FakeIdToken";
const tokensString = JSON.stringify({ access_token, id_token });
wsRequestAuthorizerEvent.queryStringParameters = {
  tokens: tokensString,
};

const fakeAccessTokenPayload: LambdaAuthorizerClaims = {
  sub: "1234567890",
  username: "testuser",
  email: "test@example.com",
  iss: "https://example.com",
  client_id: "my-client-id",
  origin_jti: "origin-jti-value",
  event_id: "event-id-value",
  token_use: "access",
  auth_time: 1658294400,
  exp: 1658298000,
  iat: 1658294400,
  jti: "jwt-id-value",
};

describe("Tests for the Websocket Lambda authorizer", () => {
  afterEach(() => {
    wsRequestAuthorizerEvent.queryStringParameters = {
      tokens: tokensString,
    };
    jest.clearAllMocks();
  });

  test("Should return a policy document allowing the connection", async () => {
    // @ts-ignore
    CognitoJwtVerifier.create = jest.fn(() => ({
      // @ts-ignore
      verify: jest.fn().mockResolvedValue(fakeAccessTokenPayload),
    }));

    const policy = await handler(wsRequestAuthorizerEvent);
    expect(policy).toEqual(
      buildPolicy(
        fakeAccessTokenPayload.sub,
        "Allow",
        wsRequestAuthorizerEvent.methodArn,
        fakeAccessTokenPayload
      )
    );
  });

  test("should return a deny policy if token verification fails", async () => {
    // @ts-ignore
    CognitoJwtVerifier.create = jest.fn(() => ({
      verify: jest
        .fn()
        // @ts-ignore
        .mockRejectedValue(new Error("Token verification failed")),
    }));

    const policy = await handler(wsRequestAuthorizerEvent);
    expect(policy).toEqual(
      buildPolicy("Unauthorized", "Deny", wsRequestAuthorizerEvent.methodArn)
    );
  });

  test("No Access Token should return a deny policy", async () => {
    wsRequestAuthorizerEvent.queryStringParameters = {
      tokens: JSON.stringify({ someRandomKey: "someRandomValue" }),
    };

    const policy = await handler(wsRequestAuthorizerEvent);
    expect(policy).toEqual(
      buildPolicy("Unauthorized", "Deny", wsRequestAuthorizerEvent.methodArn)
    );
  });
});
