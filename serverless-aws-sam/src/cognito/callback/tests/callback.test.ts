import { handler } from "../callback.js";
import { jest, describe, test, expect, afterEach } from "@jest/globals";
import { APIGatewayEvent } from "aws-lambda";
import restApiEventBase from "../../../../events/restAPIEvent.json";

let restApiEvent: APIGatewayEvent = JSON.parse(
  JSON.stringify(restApiEventBase)
);
restApiEvent.queryStringParameters = {
  code: "123456",
};
const domainURL = process.env.DOMAIN_URL;

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

afterEach(() => {
  jest.clearAllMocks();
  restApiEvent.queryStringParameters = {
    code: "123456",
  };
});

describe("Tests for the callback route", () => {
  test("Should set tokens to headers and set redirect uri to the correct location", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          access_token: "access_token",
          refresh_token: "refresh_token",
          id_token: "id_token",
          token_type: "idk, not using this",
          expires_in: 3600,
        }),
      status: 200,
      ok: true,
    } as Response);

    const response = await handler(restApiEvent);
    expect(response.statusCode).toBe(302);
    expect(response.headers?.Location).toBe(`${domainURL}/dashboard`);

    const cookies = response.multiValueHeaders?.["Set-Cookie"] as string[];

    // turns cookies array into object for easier testing of values
    const firstSplitIndex = cookies[0].indexOf("=");
    const secondSplitIndex = cookies[1].indexOf("=");
    const thirdSplitIndex = cookies[2].indexOf("=");
    const cookiesObj = {
      [cookies[0].slice(0, firstSplitIndex)]: cookies[0].slice(
        firstSplitIndex + 1,
        cookies[0].indexOf(";")
      ),
      [cookies[1].slice(0, secondSplitIndex)]: cookies[1].slice(
        secondSplitIndex + 1,
        cookies[1].indexOf(";")
      ),
      [cookies[2].slice(0, thirdSplitIndex)]: cookies[2].slice(
        thirdSplitIndex + 1,
        cookies[2].indexOf(";")
      ),
    };

    expect(cookiesObj.access_token).toBe("access_token");
    expect(cookiesObj.refresh_token).toBe("refresh_token");
    expect(cookiesObj.id_token).toBe("id_token");
    expect(cookies[3]).toBeUndefined();
  });

  test("No authCode should return the correct error Response", async () => {
    restApiEvent.queryStringParameters = {
      randomParam: "randomString",
    };

    const response = await handler(restApiEvent);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      JSON.stringify({ error: "Error While trying to log in" })
    );
  });

  test("fetch returning error should return the correct error Response", async () => {
    // @ts-ignore
    fetch.mockResolvedValue({
      status: 400,
      ok: false,
    } as Response);

    const response = await handler(restApiEvent);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(
      JSON.stringify({ error: "Error While trying to log in" })
    );
  });

  test("fetch throwing error should return the correct error Response", async () => {
    // @ts-ignore
    fetch.mockImplementation(() => {
      throw new Error("fetch failed");
    });

    const response = await handler(restApiEvent);
    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(
      JSON.stringify({ error: "Error While trying to log in" })
    );
  });
});
