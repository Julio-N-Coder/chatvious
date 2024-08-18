import { handler } from "../index.js";
import { describe, test, expect } from "@jest/globals";
import preSignUpUserNameEventBase from "../../../../events/preSignUpUserNameEvent.json";
import { PreSignUpTriggerEvent } from "aws-lambda";

let preSignUpUserNameEvent: PreSignUpTriggerEvent = JSON.parse(
  JSON.stringify(preSignUpUserNameEventBase)
);

describe("test for the userPool pre-sign-up trigger", () => {
  test("userName in valid range should Successfully return the event", async () => {
    const result = await handler(preSignUpUserNameEvent);
    expect(result).toEqual(preSignUpUserNameEvent);
  });

  test("userName less than 3 characters should throw the correct error", async () => {
    preSignUpUserNameEvent.userName = "a";
    await expect(handler(preSignUpUserNameEvent)).rejects.toThrow(
      "Username must be at least 3 characters long"
    );
  });

  test("userName greater than 20 characters should throw the correct error", async () => {
    preSignUpUserNameEvent.userName = "aaaaaaaaaaaaaaaaaaaaa";
    await expect(handler(preSignUpUserNameEvent)).rejects.toThrow(
      "Username must be at most 20 characters long"
    );
  });
});
