import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  beforeAll,
} from "@jest/globals";
import * as jose from "jose";
import { mockClient } from "aws-sdk-client-mock";
import {
  SSMClient,
  GetParameterCommand,
  GetParameterResult,
} from "@aws-sdk/client-ssm";
import wsRequestAuthorizerEventBase from "../../../../events/wsRequestAuthorizerEvent.json";
import { APIGatewayAuthorizerResult } from "aws-lambda";
import type {
  APIGatewayWebSocketAuthorizerEvent,
  LambdaAuthorizerClaims,
} from "../../../types/types.js";
import { buildPolicy } from "../../../lib/handyUtils.js";

// define mock functions here, but we will apply the mock inside the test suite.
const mockJwtVerify = jest.fn() as unknown as jest.MockedFunction<
  typeof jose.jwtVerify
>;
const mockImportSPKI = jest.fn() as unknown as jest.MockedFunction<
  typeof jose.importSPKI
>;

// declare handler here and will dynamically import it after the mocks are in place
let handler: (
  event: APIGatewayWebSocketAuthorizerEvent
) => Promise<APIGatewayAuthorizerResult>;

const ssmMock = mockClient(SSMClient);

describe("Tests for the Websocket Lambda authorizer", () => {
  beforeAll(async () => {
    // Explicitly mock jose module first with our object
    jest.unstable_mockModule("jose", () => ({
      __esModule: true,
      jwtVerify: mockJwtVerify,
      importSPKI: mockImportSPKI,
    }));

    // Dynamically import the handler.
    const module = await import("../websocket-auth.js");
    handler = module.handler;
  });

  let wsRequestAuthorizerEvent: APIGatewayWebSocketAuthorizerEvent;
  const access_token = "FakeAccessToken";

  const fakeAccessTokenPayload: LambdaAuthorizerClaims = {
    sub: "1234567890",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000) - 60,
    username: "testuser",
    token_use: "access",
  };

  const mockPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAGb9ECWmEzf6FQbrBZ9w7lshQhqowtrbLDFw4rXAxZuE=
-----END PUBLIC KEY-----\n`;

  const mockPublicKey = {} as CryptoKey;

  beforeEach(() => {
    jest.clearAllMocks();
    ssmMock.reset();

    // Re-apply default successful mocks
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: { Value: mockPublicKeyPem },
    } as GetParameterResult);
    mockImportSPKI.mockResolvedValue(mockPublicKey);

    wsRequestAuthorizerEvent = JSON.parse(
      JSON.stringify(wsRequestAuthorizerEventBase)
    );
    wsRequestAuthorizerEvent.queryStringParameters = { access_token };
  });

  test("Should return a policy document allowing the connection", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: fakeAccessTokenPayload,
      protectedHeader: { alg: "EdDSA", typ: "JWT" },
      key: mockPublicKey,
    });

    const policy = await handler(wsRequestAuthorizerEvent);

    expect(policy).toEqual(
      buildPolicy(
        fakeAccessTokenPayload.sub,
        "Allow",
        wsRequestAuthorizerEvent.methodArn,
        fakeAccessTokenPayload
      )
    );
    expect(ssmMock.calls()).toHaveLength(1);
    expect(mockImportSPKI).toHaveBeenCalledWith(mockPublicKeyPem, "EdDSA");
    expect(mockJwtVerify).toHaveBeenCalledWith(access_token, mockPublicKey, {
      algorithms: ["EdDSA"],
    });
  });

  test("should return a deny policy if token verification fails", async () => {
    mockJwtVerify.mockRejectedValue(new Error("Token verification failed"));
    const policy = await handler(wsRequestAuthorizerEvent);
    expect(policy).toEqual(
      buildPolicy("Unauthorized", "Deny", wsRequestAuthorizerEvent.methodArn)
    );
  });

  test("should return a deny policy if SSM parameter retrieval fails", async () => {
    ssmMock
      .on(GetParameterCommand)
      .rejects(new Error("SSM parameter not found"));
    const policy = await handler(wsRequestAuthorizerEvent);
    expect(policy).toEqual(
      buildPolicy("Unauthorized", "Deny", wsRequestAuthorizerEvent.methodArn)
    );
  });

  test("should return a deny policy if public key import fails", async () => {
    mockImportSPKI.mockRejectedValue(new Error("Invalid public key format"));
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

  test("No query string parameters should return a deny policy", async () => {
    wsRequestAuthorizerEvent.queryStringParameters = undefined;
    const policy = await handler(wsRequestAuthorizerEvent);
    expect(policy).toEqual(
      buildPolicy("Unauthorized", "Deny", wsRequestAuthorizerEvent.methodArn)
    );
  });
});
