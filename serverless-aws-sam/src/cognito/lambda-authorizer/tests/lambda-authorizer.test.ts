import { handler } from "../lambda-authorizer.js";
import { jest, describe, test, expect } from "@jest/globals";
import tokenAuthorizerEventBase from "../../../../events/token_authorizer_event.json";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cookie from "cookie";
import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { buildPolicy } from "../../../lib/handyUtils.js";

let tokenAuthorizerEvent: APIGatewayTokenAuthorizerEvent = JSON.parse(
  JSON.stringify(tokenAuthorizerEventBase)
);

let refresh_token = "FakeRefreshToken";
let access_token = "FakeAccessToken";
let id_token = "FakeIdToken";
let refreshTokenCookie = cookie.serialize("refresh_token", refresh_token);
let accessTokenCookie = cookie.serialize("access_token", access_token);
let idTokenCookie = cookie.serialize("id_token", id_token);
let cookieHeader = `${refreshTokenCookie}; ${accessTokenCookie}; ${idTokenCookie}`;
tokenAuthorizerEvent.authorizationToken = cookieHeader;

const fakePayload = {
  sub: "1234567890",
  username: "testuser",
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

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

jest.mock("aws-jwt-verify");

describe("tests for api gateways lambda-authorizer", () => {
  test("should return a policy when the token is valid", async () => {
    // @ts-ignore
    CognitoJwtVerifier.create = jest.fn(() => ({
      // @ts-ignore
      verify: jest.fn().mockResolvedValue(fakePayload),
    }));

    const result = await handler(tokenAuthorizerEvent);

    const claims = { claims: fakePayload };
    expect(result).toEqual(
      buildPolicy(
        fakePayload.sub,
        "Allow",
        tokenAuthorizerEvent.methodArn,
        claims
      )
    );
  });

  // can't get decomposeUnverifiedJwt to work with jest as it's a constant
  // test("should attempt to refresh tokens when access tokens is missing and successfully return them in context", async () => {
  //   tokenAuthorizerEvent.authorizationToken = refreshTokenCookie;
  //   // @ts-ignore
  //   fetch.mockResolvedValue({
  //     json: () => Promise.resolve({ access_token, id_token, refresh_token }),
  //     status: 200,
  //     ok: true,
  //   });

  //   const result = await handler(tokenAuthorizerEvent);
  //   console.log("result", result);
  // });
});
