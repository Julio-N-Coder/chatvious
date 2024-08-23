import { handler } from "../saveUserData";
import testPostConfirmationEvent from "../../../../events/saveUserDataEvent.json";
import { expect, describe, test, afterAll } from "@jest/globals";
import { userManager } from "../../../models/users.js";
import { clearDynamoDB } from "../../../lib/libtest/handyTestUtils.js";

const userID = testPostConfirmationEvent.request.userAttributes.sub;

afterAll(async () => {
  await clearDynamoDB();
});

describe("Test for saveUserData", () => {
  const tableName = process.env.CHATVIOUSTABLE_TABLE_NAME;

  test("Verifies successful response", async () => {
    const result = await handler(testPostConfirmationEvent);

    expect(result).toEqual(testPostConfirmationEvent);
  });

  test("Verifies Data Is stored in dynamodb", async () => {
    const response = await userManager.fetchUserInfo(userID);
    if ("error" in response) {
      throw new Error(
        `Failed to get userInfo during test. Error: ${response.error}`
      );
    }

    expect(response.statusCode).toBe(200);
    expect(response).toHaveProperty("userInfo");
    expect(response.userInfo).toHaveProperty("userID", userID);
  });
});
